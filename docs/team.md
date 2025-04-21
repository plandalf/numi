# Team

Ability to invite team members 
each team has a join page
/organizations/settings/team

- email invite should be removed
- use a hash of the org ulid as the url token and store it on org model 
- auth/join-team/{token}
- everyone joins with the same role that can do everything in the account
- everyone can delete everyone
- users cannot delete themselves
- give warning on delete

### Joining

- if user is logged out, they will be prompted to register
- token gets stored in session
- when registering they see which team they're joining on the register page 
- then submitting the form, join the team
- keep in mind this needs to work with SSO (in future)
- if user is already logged in, they will be prompted "Join Team" button
- clicking button will POST to the join team route and they will auto-join
- users can see which teams they're a part of in the sidebar 

