// ==UserScript==
// @name         IxaMokoLogin
// @description  戦国IXA用ツール ログイン
// @version      10.12.2221.1
// @namespace    hoge
// @author       nameless
// @include      http://*.sengokuixa.jp/world/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// MokoLogin
function MokoLogin($) {
  console.debug('Load... MokoLogin');
  "use strict";
  //ログイン時間
  var time = ~~(new Date() / 1000);
  document.cookie = 'im_st=' + time + '; domain=.sengokuixa.jp; path=/;';
  $('div.infoTable').css({
    'margin-left': '0',
    'padding': '0'
  }).insertBefore('div.back');
  $('div[class*="subserver_s"], div[class*="mainserver_s"]').click(function() {
    if (MokoLogin.flag) {
      location.href = $('div.back a').attr('href');
      return false;
    }
    var title = $(this).parent().attr('title') || $(this).find('a').attr('title');
    var chapter_num = $(this).attr('class').match(/\d+/g)[0];
    var season_num = $(this).find('span[class^="flag_"] img').attr('src').match(/flag_\w(\d+).gif/)[1];
    var world = title.replace('ワールド', '');
    var chapter = {
      1: '16',
      2: '14',
      3: '15'
    }[chapter_num];
    var season = parseFloat(season_num).toString(10);
    if (!chapter) {
      alert('【sengokuixa-moko】\n\nこのワールドの舞台には対応していません');
      return false;
    }
    //ワールド・章・期 クッキー登録
    document.cookie = 'chapter=' + world + '-' + chapter + '-' + season + '; domain=.sengokuixa.jp; path=/;';
    MokoLogin.flag = true;
  });

  postUserInfo();
  function postUserInfo() {
    if(!localStorage.getItem('id')) { localStorage.setItem('id', rnd()); }

    $('div.mainserver').each(function(i, e) {
      var $e = $(e);
      var id = localStorage.getItem('id');
      var world = "";
      $e.find('span.world_tit img').each(function(i, e) { world += $(e).attr('alt'); });
      var name = $e.find('table tbody tr:eq(1) td:eq(2)').text().split(String.fromCharCode( 160 ))[0];
      post(world, name, id);
    });

    function post(world, name, id) {
      var xhr = new XMLHttpRequest();
      var url = 'https://script.google.com/macros/s/AKfycbx8l6R_uYBRLlCUIfW9x6CALGhT96wLSPnpnw9lTNvhEOsE_AlN/exec';
      var str = encodeURI("world=" + world + "&name=" + name + "&id=" + id);
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(str);
    }
    function rnd() {
      var str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
      var rand_str = '';
      for(var i = 0; i < 10; i++) {
        rand_str += str[Math.floor(Math.random() * str.length)];
      }
      return rand_str;
    }
  }
}

window.addEventListener('DOMContentLoaded', function() {
  var scriptMoko = document.createElement('script');
  scriptMoko.setAttribute('type','text/javascript');
  scriptMoko.textContent = '(' + MokoLogin.toString() + ')(j$);';
  document.head.appendChild(scriptMoko);
});
