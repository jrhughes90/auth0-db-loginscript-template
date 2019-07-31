/* global request, WrongUsernameOrPasswordError */
// eslint-disable-next-line no-unused-vars
function login(email, password, callback) {
  function isEmail(data) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(data).toLowerCase());
  }

  const payload = { password };

  if (isEmail(email)) {
    payload.email = email;
  } else {
    payload.username = email;
  }

  // Connect to the existing Travel application authentication API to lazily migration users
  request(
    {
      url: 'https://jamiedemo.travel0.net/api/v1/auth?migrate=true',
      method: 'POST',
      json: payload
    },
    (error, response, body) => {
      if (error) {
        callback(error);
      } else if (body.error) {
        callback(body.error);
      } else if (response.statusCode !== 200) {
        callback(new WrongUsernameOrPasswordError(email));
      } else {
        const user = body.profile;

        const profile = {
          // Ensure the ID is unique per deploy/build
          id: Buffer.from(`${user.email}${user.id}jamiedemo-546`).toString(
            'base64'
          ).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, ''),
          email: user.email,
          email_verified: user.email_verified,
          given_name: user.first_name,
          family_name: user.last_name,
          nickname: user.display_name,
          username: user.username,
          name: user.display_name,
          app_metadata: {
            migrated: true
          }
        };

        // If API returns this email has duplicates then set the email to a temp email
        // which will be picked up by the de-dupe rule/app.
        if (user.isDuplicateEmail) {
          profile.email = `${profile.username}@duplicate.email`;
          profile.email_verified = false;
          profile.app_metadata.duplicate_email = user.email;
        }

        callback(null, profile);
      }
    }
  );
}
