/* global request */
// eslint-disable-next-line no-unused-vars
function getUser(email, callback) {
  function isEmail(data) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(data).toLowerCase());
  }

  const search = isEmail(email) ? `email=${email}` : `username=${email}`;

  // Connect to the existing application authentication API
  request(
    {
      url: `https://jamiedemo.travel0.net/api/v1/legacy/user?${search}`,
      method: 'GET',
      json: true
    },
    (error, response, body) => {
      if (error) {
        callback(null);
      } else if (!body.profile) {
        callback(null);
      } else {
        const { profile } = body;

        const user = {
          // Ensure the ID is unique per deploy/build
          id: Buffer.from(`${profile.email}${profile.id}jamiedemo-546`).toString(
            'base64'
          ).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, ''),
          email: profile.email,
          given_name: profile.first_name,
          family_name: profile.last_name,
          nickname: profile.display_name,
          username: profile.username,
          name: profile.display_name,
          email_verified: profile.email_verified,
          app_metadata: {
            company: profile.company,
            migrated: true
          }
        };
        if (profile.isDuplicateEmail) {
          user.email = `${user.username}@duplicates.email`;
          user.email_verified = false;
          user.app_metadata.migrated_email = profile.email;
        }

        callback(null, profile);
      }
    }
  );
}
