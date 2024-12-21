/**
 * Lists all members of the team.
 *
 * @returns {Promise<void>} A promise that resolves when the listing is complete.
 */
async function listTeamMembers() {
  const members = await getJSONFromAPI(`/v2/teams/${VERCEL_TEAM}/members`)
  console.log(pc.cyan('Team Members:'))
  for (const member of members) {
    console.log(`- ${member.email}`)
  }
}
