### [password manager](https://github.com/warren-bank/crx-password-manager/tree/webmonkey-userscript/es5)

[Userscript](https://github.com/warren-bank/crx-password-manager/raw/webmonkey-userscript/es5/webmonkey-userscript/password-manager.user.js) to run in both:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android
* the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) web browser extension for Chrome/Chromium

Its purpose is to:
* use configuration data to detect login forms, clear site cookies, populate user credentials

#### Format of configuration data:

```javascript
const data = {
  [url]: {
    dom:  {
      username: 'input[type="text"]#username',
      password: 'input[type="password"]#password',
      submit:   'button[type="submit"]#login'
    },
    accounts: [
      {username: 'foo@example.com', password: '123abc'},
      {username: 'bar@example.com', password: '456def'},
      {username: 'baz@example.com', password: '789ghi'}
    ],
    events: {
      preUsername: function($username_element){
        $username_element.blur()
      },
      prePassword: function($password_element){
        $password_element.blur()
      },
      postUsername: function($username_element){
        return 'change'
      },
      postPassword: function($password_element){
        return 'change'
      },
      preSubmit: function($submit_element){
        return false
      }
    }
  }
}
```

where:

* `url`
  - string
  - case insensitive
  - either:
    * an exact match
    * a glob pattern, which must end with the `*` character
    * a regex pattern, which must begin with the `^` character
      - only valid if it can be compiled by: `new RegExp(url, 'i')`
* `data[url].dom.username` and `data[url].dom.password`
  - css selectors to find the _username_ and _password_ input form fields in the DOM, respectively
* `data[url].accounts.length`
  - if greater than 1, will prompt user to select one account for the login session
* `data[url].events.preXXX`
  - is called before DOM fields (ie: _username_ or _password_) are populated, or DOM buttons (ie: _submit_) are clicked
  - when the return value is:
    * `false`
      - the DOM operation is cancelled
* `data[url].events.postXXX`
  - is called after DOM fields (ie: _username_ or _password_) are populated
  - when the return value is:
    * either a String or Array of Strings
      - for each String: an Event is dispatched to the DOM field
    * `false`
      - no Events are dispatched to the DOM field
    * default:
      - an Array containing several relevant Event types are dispatched to the DOM field

#### Warning:

* `data` is defined at the beginning of the userscript, and its value will be lost when the userscript receives an automatic update
  - either:
    * keep a backup of `data`
    * remove `@downloadURL` and `@updateURL` from the userscript header, to disable the userscript's ability to automatic update

#### Danger:

* `data` is defined in cleartext, and its content is not secure
  - do __not__ use when account security is a strong concern
  - only intended for accounts without security implications
  - for example:
    * grocery stores
      - to view shopping lists, and clip coupons
      - to easily switch between multiple accounts
      - to avoid installing bespoke mobile apps, that weigh over 100 MB each

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
