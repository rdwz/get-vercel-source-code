#!/usr/bin/env node

import "dotenv/config";
import * as fs from "fs";
import got from "got";
import pc from "picocolors";
import { oraPromise } from "ora";
import { promisify } from 'node:util';
import stream from 'node:stream';

const pipeline = promisify(stream.pipeline);
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_DEPLOYMENT = process.argv[2];
const DEST_DIR = process.argv[3] || VERCEL_DEPLOYMENT;
const VERCEL_TEAM = process.env.VERCEL_TEAM;
const VERCEL_API = "https://api.vercel.com";

try {
	if (VERCEL_TOKEN === undefined) {
		console.error("Missing VERCEL_TOKEN in .env file.",
			"\nLook at README for more information",
		)
	} else if (VERCEL_DEPLOYMENT === undefined) {
		console.error("Missing deployment URL or id");
		console.log(
			"\ne.g: node index.js example-5ik51k4n7.vercel.app",
			"\ne.g: node index.js dpl_6CR1uw9hBdpWgrMvPkncsTGRC18A",
		);
	} else {
		await main();
	}
} catch (err) {
	console.error(err.stack || err);
}

/**
 * Asynchronously executes the main function.
 *
 * @return {Promise<void>} A promise that resolves when the main function completes execution.
 */
async function main() {
  const deploymentId = VERCEL_DEPLOYMENT.startsWith("dpl_")
    ? VERCEL_DEPLOYMENT
    : await oraPromise(getDeploymentId(VERCEL_DEPLOYMENT), "Getting deployment id 🏷️");
  const srcFiles = await oraPromise(getDeploymentSource(deploymentId), "Loading source files tree 🗄️");
  if (fs.existsSync(DEST_DIR)) fs.rmSync(DEST_DIR, { recursive: true });
	fs.mkdirSync(DEST_DIR);
  Promise.allSettled(
    srcFiles
      .map((file) => {
        let pathname = file.name.replace("src", DEST_DIR);
        if (fs.existsSync(pathname)) return null;
        if (file.type === "directory") fs.mkdirSync(pathname);
        if (file.type === "file") {
          return oraPromise(downloadFile(deploymentId, file.uid, pathname), `Downloading ${pc.green(pathname)}`);
        }
      })
      .filter(Boolean)
  );
}

/**
 * Retrieves the deployment source files for the specified ID.
 *
 * @param {string} id - The ID of the deployment.
 * @return {Promise<Object>} A promise that resolves to the deployment source files.
 */
async function getDeploymentSource(id) {
	let path = `/v7/deployments/${id}/files`;
	if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`;
	const files = await getJSONFromAPI(path);
	// Get only src directory
	const source = files.find((x) => x.name === "src");
	// Flatten tree structure to list of files/dirs for easier downloading
	return flattenTree(source);
}

/**
 * Retrieves the deployment ID for a given domain.
 *
 * @param {string} domain - The domain for which to retrieve the deployment ID.
 * @return {Promise<string>} The ID of the deployment.
 */
async function getDeploymentId(domain) {
	const deployment = await getJSONFromAPI(`/v13/deployments/${domain}`);
	return deployment.id;
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
  let path = `/v7/deployments/${deploymentId}/files/${fileId}`;
  if (VERCEL_TEAM) path += `?teamId=${VERCEL_TEAM}`;
  const response = await getFromAPI(path);
  return new Promise((resolve, reject) => {
		// console.log(atob(JSON.parse(response.body)["data"]));
		const encodedValue = JSON.parse(response.body)["data"];
		const decodedValue = atob(encodedValue);
    fs.writeFile(destination, decodedValue, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

/**
 * Retrieves data from an API endpoint.
 *
 * @param {string} path - The path of the API endpoint.
 * @param {boolean} [binary=false] - Whether the response should be treated as binary data.
 * @returns {Promise} A Promise that resolves to the response from the API.
 */
function getFromAPI(path, binary = false) {
	return (binary ? got.stream : got)(VERCEL_API + path, {
		headers: {
			Authorization: `Bearer ${VERCEL_TOKEN}`,
		},
		method: "get",
		retry: {
			limit: 0,
		},
	});
}

/**
 * Retrieves JSON data from the API at the specified path.
 *
 * @param {string} path - The path to the API endpoint.
 * @return {Promise} A Promise that resolves to the JSON data returned by the API.
 */
function getJSONFromAPI(path) {
	return getFromAPI(path).json();
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
	let childrenNamed = children.map(child => ({
		...child,
		name: `${name}/${child.name}`,
	}));
	let flattenedChildren = childrenNamed.flatMap(flattenTree);
	return [...childrenNamed, ...flattenedChildren];
}
