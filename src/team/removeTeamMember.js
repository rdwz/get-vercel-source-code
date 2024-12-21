/**
 * Removes a member from the team.
 *
 * @param {string} email - The email of the member to remove.
 * @returns {Promise<void>} A promise that resolves when the member is removed.
 */
async function removeTeamMember(email) {
  await got.delete(`${VERCEL_API}/v2/teams/${VERCEL_TEAM}/members/${email}`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
  })
  console.log(pc.green(`Member ${email} removed from the team successfully.`))
}
