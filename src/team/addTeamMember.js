/**
 * Adds a new member to the team.
 *
 * @param {string} email - The email of the new member.
 * @returns {Promise<void>} A promise that resolves when the member is added.
 */
async function addTeamMember(email) {
  await got.post(`${VERCEL_API}/v2/teams/${VERCEL_TEAM}/members`, {
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
    },
    json: {
      email: email,
    },
  })
  console.log(pc.green(`Member ${email} added to the team successfully.`))
}
