/**
 * Deletes a specific project.
 *
 * @param {string} projectId - The ID of the project.
 * @returns {Promise<void>} A promise that resolves when the project is deleted.
 */
async function deleteProject(projectId) {
  await got.delete(`${VERCEL_API}/v2/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  })
  console.log(pc.green(`Project ${projectId} deleted successfully.`))
}
