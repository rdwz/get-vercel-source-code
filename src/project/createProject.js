/**
 * Creates a new project.
 *
 * @param {string} projectName - The name of the new project.
 * @returns {Promise<void>} A promise that resolves when the project is created.
 */
async function createProject(projectName) {
  await got.post(`${VERCEL_API}/v2/projects`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
    json: {
      name: projectName,
    },
  })
  console.log(pc.green(`Project ${projectName} created successfully.`))
}
