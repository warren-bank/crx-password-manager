// ==UserScript==
// @name         Home Page
// @description  Display a list of bookmarks. Remove all cookies when the page loads. Conditionally change 'User-Agent' when a bookmark is clicked, but before its URL opens.
// @version      1.0.0
// @include      about:blank
// @icon         https://github.com/google/material-design-icons/raw/4.0.0/png/action/home/materialiconstwotone/24dp/2x/twotone_home_black_24dp.png
// @run-at       document-end
// @grant        GM_removeAllCookies
// @grant        GM_setUserAgent
// @homepage     https://github.com/warren-bank/crx-password-manager/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-password-manager/issues
// @downloadURL  https://github.com/warren-bank/crx-password-manager/raw/webmonkey-userscript/es5/webmonkey-userscript/helper/homepage.user.js
// @updateURL    https://github.com/warren-bank/crx-password-manager/raw/webmonkey-userscript/es5/webmonkey-userscript/helper/homepage.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- configuration

const bookmarks = [
  {
    title: "Smith's",
    url:   "https://www.smithsfoodanddrug.com/signin?redirectUrl=/cl/mycoupons/",
    agent: "WebView"
  },
  {
    title: "Vons",
    url:   "https://www.vons.com/account/sign-in.html",
    agent: "Chrome"
  },
  {
    title: "Albertsons",
    url:   "https://www.albertsons.com/account/sign-in.html",
    agent: "Chrome"
  }
]

// ----------------------------------------------------------------------------- DOM helpers

var removeAllChildren = function(el) {
  while(el.childNodes.length)
    el.removeChild(el.childNodes[0])
}

var getStyle = function() {
  var $style = document.createElement('style')

  $style.appendChild(
    document.createTextNode(
      [
        'h3 {font-size: 30px;}',
        'a {text-decoration: none; color: black;}'
      ].join("\n")
    )
  )

  return $style
}

var updateHead = function() {
  var $head = document.head

  removeAllChildren($head)

  $head.appendChild(
    getStyle()
  )
}

var getBookmark = function(data) {
  var $h3 = document.createElement('h3')
  var $a  = document.createElement('a')

  $a.setAttribute('href', data.url)
  $a.textContent = data.title

  $a.addEventListener('click', function(event){
    event.preventDefault()

    if (data.agent !== undefined)
      GM_setUserAgent(data.agent)

    setTimeout(
      function() {
        window.location.href = data.url
      },
      1500
    )
  })

  $h3.appendChild($a)
  return $h3
}

var updateBody = function() {
  var $body = document.body

  removeAllChildren($body)

  for (var i=0; i < bookmarks.length; i++) {
    $body.appendChild(
      getBookmark(bookmarks[i])
    )
  }
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  GM_removeAllCookies()

  updateHead()
  updateBody()
}

init()
