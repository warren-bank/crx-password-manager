// ==UserScript==
// @name         password manager
// @description  Use configuration data to detect login forms, clear site cookies, populate user credentials.
// @version      1.0.0
// @include      /^.*$/
// @icon         https://github.com/google/material-design-icons/raw/4.0.0/png/action/lock_open/materialiconstwotone/24dp/2x/twotone_lock_open_black_24dp.png
// @run-at       document-end
// @grant        GM_cookie
// @homepage     https://github.com/warren-bank/crx-password-manager/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-password-manager/issues
// @downloadURL  https://github.com/warren-bank/crx-password-manager/raw/webmonkey-userscript/es5/webmonkey-userscript/password-manager.user.js
// @updateURL    https://github.com/warren-bank/crx-password-manager/raw/webmonkey-userscript/es5/webmonkey-userscript/password-manager.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- configuration

const data = {
  "^https?://(?:[^\\./]*\\.)*vons\\.com/.*$": {
    dom:  {
      username: 'input[type="text"]#enterUsername',
      password: 'input[type="password"]#password',
      submit:   'button[type="submit"][aria-label="Sign in"]'
    },
    accounts: [
      {username: 'foo@example.com', password: '123abc'},
      {username: 'bar@example.com', password: '456def'},
      {username: 'baz@example.com', password: '789ghi'}
    ],
    events: {
      preUsername: function($username_element){},
      prePassword: function($password_element){},
      postUsername: function($username_element){
        return 'input'
      },
      postPassword: function($password_element){
        return 'input'
      },
      preSubmit: function($submit_element){
        return false
      }
    }
  },

  "^https?://(?:[^\\./]*\\.)*albertsons\\.com/.*$": {
    dom:  {
      username: 'input[type="text"][name="userId"]#label-email',
      password: 'input[type="password"][name="inputPassword"]#label-password',
      submit:   'input[type="submit"]#btnSignIn'
    },
    accounts: [
      {username: 'foo@example.com', password: '123abc'},
      {username: 'bar@example.com', password: '456def'},
      {username: 'baz@example.com', password: '789ghi'}
    ],
    events: {
      preUsername: function($username_element){},
      prePassword: function($password_element){},
      postUsername: function($username_element){
        return false
      },
      postPassword: function($password_element){
        return false
      },
      preSubmit: function($submit_element){
        return false
      }
    }
  },

  /* -------------------------------------------------------
   * notes:
   * -------------------------------------------------------
   * smithsfoodanddrug.com login form fails to communicate
   * with its backend server when the User-Agent is modified.
   *
   * issue: ERR_HTTP2_PROTOCOL_ERROR
   * -------------------------------------------------------
   */

  "^https?://(?:[^\\./]*\\.)*smithsfoodanddrug\\.com/.*$": {
    dom:  {
      username: 'input[type="email"][name="email"]#SignIn-emailInput',
      password: 'input[name="password"]#SignIn-passwordInput',
      submit:   'button[type="submit"]#SignIn-submitButton'
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

// ----------------------------------------------------------------------------- state

var state = null

var reset_state = function() {
  state = {
    url:     null,
    domain:  null,
    account: null,
    timer:   null
  }
}

reset_state()

// ----------------------------------------------------------------------------- helper

// https://stackoverflow.com/a/21696585
var isHidden = function(el) {
  if (el.offsetParent === null)
    return true

  var style = window.getComputedStyle(el)
  if (style.display === 'none')
    return true

  return false
}

var clearCookies = function(url) {
  if (!url) return

  var list_details, callback

  list_details = {url: url}

  callback = function(cookies) {
    if (!cookies || !Array.isArray(cookies) || !cookies.length) return

    var cookie, delete_details

    for (var i=0; i < cookies.length; i++) {
      cookie = cookies[i]
      delete_details = {url: url, name: cookie.name}

      GM_cookie.delete(delete_details)
    }
  }

  GM_cookie.list(list_details, callback)
}

var allFieldUpdateEvents = [
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement#input_events
  'input', 'change',

  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
  'mousedown', 'mouseup', 'click',

  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
  'keydown', 'keyup', 'keypress',

  // https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent
  'focusout', 'blur'
]

var dispatchFieldUpdateEvents = function($field, events) {
  if (events === false) return

  if (events && (typeof events === 'string'))
    events = [events]

  if (!Array.isArray(events) || !events.length)
    events = allFieldUpdateEvents

  var event

  for (var i=0; i < events.length; i++) {
    try {
      // https://stackoverflow.com/a/46012210

      event = new Event(events[i], {bubbles: true})
      event.simulated = true
      $field.dispatchEvent(event)
    }
    catch(e){}
  }
}

// ----------------------------------------------------------------------------- history API hooks

var addHistoryApiHooks = function(callback) {
  if (!callback)
    callback = historyApiCallback

  if (window.history) {
    var real = {
      pushState:    window.history.pushState,
      replaceState: window.history.replaceState
    }

    window.history.pushState = function(state, title, url) {
      real.pushState.apply(window.history, [state, title, url])
      setTimeout(callback, 2500)
    }

    window.history.replaceState = function(state, title, url) {
      real.replaceState.apply(window.history, [state, title, url])
      setTimeout(callback, 2500)
    }
  }
}

var historyApiCallback = function() {
  if (state.timer) {
    clearTimeout(state.timer)
    clearInterval(state.timer)
  }
  reset_state()
  init()
}

// ----------------------------------------------------------------------------- DOM event handlers

var runEventHandler = function($field, eventHandler) {
  return ($field && eventHandler && (typeof eventHandler === 'function'))
    ? eventHandler($field)
    : true
}

var preUsername = function($field) {
  var eventHandler = data[state.url].events.preUsername
  return runEventHandler($field, eventHandler)
}

var prePassword = function($field) {
  var eventHandler = data[state.url].events.prePassword
  return runEventHandler($field, eventHandler)
}

var preSubmit = function($field) {
  var eventHandler = data[state.url].events.preSubmit
  return runEventHandler($field, eventHandler)
}

var postUsername = function($field) {
  var eventHandler = data[state.url].events.postUsername
  var events = runEventHandler($field, eventHandler)

  dispatchFieldUpdateEvents($field, events)
}

var postPassword = function($field) {
  var eventHandler = data[state.url].events.postPassword
  var events = runEventHandler($field, eventHandler)

  dispatchFieldUpdateEvents($field, events)
}

// ----------------------------------------------------------------------------- DOM event triggers (generic)

var updateField = function($field, value, preEventHandler, postEventHandler) {
  if (!$field) return

  var result, nativeInputValueSetter

  if (preEventHandler && (typeof preEventHandler === 'function'))
    result = preEventHandler($field)

  if (result === false) return

  $field.value = value

  try {
    // https://stackoverflow.com/a/46012210

    nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeInputValueSetter.call($field, value)
  }
  catch(e){}

  if (postEventHandler && (typeof postEventHandler === 'function'))
    postEventHandler($field)
}

var clickField = function($field, preEventHandler) {
  if (!$field) return

  var result

  if (preEventHandler && (typeof preEventHandler === 'function'))
    result = preEventHandler($field)

  if (result === false) return

  dispatchFieldUpdateEvents($field, 'click')
}

// ----------------------------------------------------------------------------- DOM event triggers (specific)

var updateUsername = function($user) {
  updateField(
    $user,
    data[state.url].accounts[state.account].username,
    preUsername,
    postUsername
  )
}

var updatePassword = function($pass) {
  updateField(
    $pass,
    data[state.url].accounts[state.account].password,
    prePassword,
    postPassword
  )
}

var performSubmit = function($submit) {
  clickField(
    $submit,
    preSubmit
  )
}

// ----------------------------------------------------------------------------- bootstrap

var init = function(first_run) {
  var href = window.location.href.toLowerCase()
  var urls = Object.keys(data)
  var url, url_lc, pattern
  var qs, $user, $pass, $submit

  if (!state.url) {
    for (var i=0; i < urls.length; i++) {
      url = urls[i]

      if (!url) continue

      url_lc = url.toLowerCase()

      if (url[0] === '^') {
        try {
          pattern = new RegExp(url_lc)

          if (pattern.test(href)) {
            state.url = url
            break
          }
        }
        catch(e){}
        continue
      }

      if (url[(url.length - 1)] === '*') {
        try {
          pattern = url_lc.substring(0, (url.length - 1))

          if ((href.length >= pattern.length) && (href.substring(0, pattern.length) === pattern)) {
            state.url = url
            break
          }
        }
        catch(e){}
        continue
      }

      if (url_lc === href) {
        state.url = url
        break
      }
    }
  }

  if (!state.url) return

  if (first_run)
    addHistoryApiHooks()

  qs = data[state.url].dom.username
  $user = qs ? document.querySelector(qs) : null

  qs = data[state.url].dom.password
  $pass = qs ? document.querySelector(qs) : null

  qs = data[state.url].dom.submit
  $submit = qs ? document.querySelector(qs) : null

  if (!$user && !$pass) {
    reset_state()
    return
  }

  if ((!$user || isHidden($user)) && (!$pass || isHidden($pass))) {
    state.timer = setTimeout(init, 2500)
    return
  }
  else if (state.timer) {
    state.timer = null
  }

  state.domain = window.location.protocol + '//' + window.location.host + '/'

  clearCookies(state.domain)

  if (data[state.url].accounts.length > 1) {
    state.account = window.prompt(
      data[state.url].accounts
        .map(function(account, index){return '' + (index + 1) + ') ' + account.username})
        .join("\n")
    )

    state.account = parseInt(state.account, 10)

    if ((typeof state.account === 'number') && (state.account >= 1)) {
      state.account -= 1
    }
    else {
      reset_state()
      return
    }
  }
  else if (data[state.url].accounts.length === 1) {
    state.account = 0
  }
  else {
    reset_state()
    return
  }

  if ($user) {
    updateUsername($user)

    if ($pass) {
      setTimeout(
        function(){
          updatePassword($pass)
          performSubmit($submit)
        },
        1000
      )
    }
    else {
      state.timer = setInterval(
        function(){
          $pass = document.querySelector(
            data[state.url].dom.password
          )

          if ($pass) {
            clearInterval(state.timer)
            state.timer = null

            updatePassword($pass)
            performSubmit($submit)
          }
        },
        2500
      )
    }
  }
  else {
    updatePassword($pass)
    performSubmit($submit)
  }
}

init(true)
