/**
 * Updates the name of an existing project.
 *
 * @param {string} projectId - The ID of the project.
 * @param {string} newName - The new name of the project.
 * @returns {Promise<void>} A promise that resolves when the project is updated.
 */
async function updateProject(projectId, newName) {
  await got.patch(`${VERCEL_API}/v2/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
    json: {
      name: newName,
    },
  })
  console.log(pc.green(`Project ${projectId} updated to ${newName} successfully.`))
}
