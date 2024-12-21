#!/bin/env node

import dotenv from 'dotenv'
import * as fs from 'node:fs'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import archiver from 'archiver'
import { Command } from 'commander'
import got from 'got'
import { oraPromise } from 'ora'
import pc from 'picocolors'
import { VERCEL_API_BASE, VERCEL_API_TOKEN, VERCEL_TEAM } from './const.js'

dotenv.config()
console.debug = process.env.DEBUG ? console.debug : () => {};
console.debug('VERCEL_API_BASE:', VERCEL_API_BASE)
console.debug('VERCEL_API_TOKEN:', VERCEL_API_TOKEN)
console.debug('VERCEL_API_TOKEN:', VERCEL_TEAM)

import pkg from '../package.json' assert { type: 'json' };

const version = pkg.version

const pipelineAsync = promisify(pipeline)
const program = new Command()

program
  .name(pc.magentaBright('vscdl'))
  .version(version)
  .description(pc.cyan('CLI tool to download source code of your vercel projects'))
  .option('-d, --download <url|id>', 'Vercel deployment URL or ID', process.argv[2])
  .option('-o, --output <output>', 'Output directory', process.argv[3])
  .parse(process.argv)

const options = program.opts()

const VERCEL_DEPLOYMENT = process.argv[2]
const DEST_DIR = options.output || (VERCEL_DEPLOYMENT ?? '');

(async () => {
  try {
    console.log(`${pc.magenta(`
░  ░░░░  ░░      ░░░░      ░░░       ░░░  ░░░░░░░
▒  ▒▒▒▒  ▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒  ▒▒  ▒▒▒▒  ▒▒  ▒▒RDWZ▒
▓▓  ▓▓  ▓▓▓      ▓▓▓  ▓▓▓▓▓▓▓▓  ▓▓▓▓  ▓▓  ▓▓2024▓
███    █████████  ██  ████  ██  ████  ██  ███████
████  █████      ████      ███       ███        █
(Unofficial) Vercel Source Code Down Loader ${version}`)}\n`)
    if (!VERCEL_API_TOKEN) {
      console.error(pc.red('Missing VERCEL_API_TOKEN. Use environment variable or set VERCEL_API_TOKEN in .env file.'), '\nLook at README for more information')
      process.exit(1)
    }
    if (!VERCEL_DEPLOYMENT) {
      console.log(
        pc.bold(`Usage: ${pc.magentaBright('vscdl')} ${pc.dim('<')}${pc.blueBright('getsource.vercel.app')}${pc.dim('|')}${pc.blueBright('dpl_id0wn104d')}${pc.dim('>')}`)
      )
      process.exit(1)
    }

    await main()
    
  } catch (err) {
    console.error(pc.red(err.stack || err))
    process.exit(1)
  }
})()

/**
 * Asynchronously executes the main function.
 *
 * @return {Promise<void>} A promise that resolves when the main function completes execution.
 */
async function main() {
  console.log(`${pc.blue('⬇')} Fetching source from ${pc.blue(DEST_DIR)}`)
  const deploymentId = VERCEL_DEPLOYMENT.startsWith('dpl_')
    ? VERCEL_DEPLOYMENT
    : await oraPromise(getDeploymentId(VERCEL_DEPLOYMENT), 'Getting deployment id 🏷️')
  const srcFiles = await oraPromise(getDeploymentSource(deploymentId), 'Loading source files tree 🗃️')
  if (fs.existsSync(DEST_DIR)) fs.rmSync(DEST_DIR, { recursive: true })
  fs.mkdirSync(DEST_DIR)
  await Promise.allSettled(
    srcFiles
      .map((file) => {
        const pathname = file.name.replace('src', DEST_DIR)
        if (fs.existsSync(pathname)) return null
        if (file.type === 'directory') {
          fs.mkdirSync(pathname)
          return null
        }
        if (file.type === 'file') {
          return oraPromise(downloadFile(deploymentId, file.uid, pathname), `Downloading ${pc.green(`${DEST_DIR}${new URL(`file://${pathname}`).pathname}`)}`)
        }
        return null
      })
      .filter(Boolean)
  )
}

/**
 * Retrieves the deployment source files for the specified ID.
 *
 * @param {string} id - The ID of the deployment.
 * @return {Promise<Object>} A promise that resolves to the deployment source files.
 */
async function getDeploymentSource(id) {
  let path = `/v7/deployments/${id}/files`
  if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`
  const files = await getJSONFromAPI(path)
  // Get only src directory
  const source = files.find((x) => x.name === 'src')
  // Flatten tree structure to list of files/dirs for easier downloading
  return flattenTree(source)
}

/**
 * Retrieves the deployment ID for a given domain or project name.
 *
 * @param {string} identifier - The domain or project name for which to retrieve the deployment ID.
 * @return {Promise<string>} The ID of the deployment.
 */
async function getDeploymentId(identifier) {
  if (identifier.startsWith('dpl_')) {
    return identifier
  }
  try {
    const deployment = await getJSONFromAPI(`/v13/deployments/${identifier}`)
    return deployment.id
  } catch (error) {
    const { deployments } = await getJSONFromAPI(`/v12/projects/${identifier}/deployments?limit=1&sort=created`)
    const successfulDeployments = deployments.filter((deployment) => deployment.readyState === 'READY')
    if (successfulDeployments.length > 0) {
      return successfulDeployments[0].uid
    }
    throw new Error('No successful deployments found for the project')
  }
}

/**
 * Downloads a file from the API and saves it to the specified destination.
 *
 * @param {string} deploymentId - The ID of the deployment.
 * @param {string} fileId - The ID of the file to download.
 * @param {string} destination - The path where the file should be saved.
 * @returns {Promise} A promise that resolves when the file has been successfully downloaded and saved.
 */
async function downloadFile(deploymentId, fileId, destination) {
  let path = `/v7/deployments/${deploymentId}/files/${fileId}`
  if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`
  const response = await getFromAPI(path, true)
  return new Promise((resolve, reject) => {
    response
      .pipe(fs.createWriteStream(destination))
      .on('error', reject)
      .on('close', resolve)
  })
}

/**
 * Retrieves data from an API endpoint.
 *
 * @param {string} path - The path of the API endpoint.
 * @param {boolean} [binary=false] - Whether the response should be treated as binary data.
 * @returns {Promise} A Promise that resolves to the response from the API.
 */
function getFromAPI(path, binary = false) {
  return (binary ? got.stream : got)(VERCEL_API_BASE + path, {
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    },
    responseType: binary ? 'buffer' : 'json',
    retry: {
      limit: 0,
    },
  })
}

/**
 * Retrieves JSON data from the API at the specified path.
 *
 * @param {string} path - The path to the API endpoint.
 * @return {Promise} A Promise that resolves to the JSON data returned by the API.
 */
function getJSONFromAPI(path) {
  return getFromAPI(path).json()
}

/**
 * Flattens a tree structure by recursively concatenating the name of each node with its children's names.
 *
 * @param {Object} node - The root node of the tree.
 * @param {string} node.name - The name of the node.
 * @param {Array} [node.children] - The children of the node (optional).
 * @return {Array} - An array containing all the nodes in the flattened tree.
 */
function flattenTree({ name, children = [] }) {
  const childrenNamed = children.map((child) => ({
    ...child,
    name: `${name}/${child.name}`,
  }))
  const flattenedChildren = childrenNamed.flatMap(flattenTree)
  return [...childrenNamed, ...flattenedChildren]
}

/**
 * Lists all projects or deployments.
 *
 * @returns {Promise<void>} A promise that resolves when the listing is complete.
 */
async function listProjectsOrDeployments() {
  const projects = await getJSONFromAPI('/v2/projects')
  console.log(pc.cyan('Projects:'))
  for (const project of projects) {
    console.log(`- ${project.name} (${project.id})`)
  }
}

