// ==UserScript==
// @name         IxaTraining
// @description  一括兵士訓練ツール
// @version      10.0.1.8
// @namespace    hoge
// @author       nameless
// @include      http://*.sengokuixa.jp/*
// @exclude      http://sengokuixa.jp/*
// @exclude      http://world.sengokuixa.jp/*
// @run-at       document-start
// ==/UserScript==

// https://github.com/metameta/sengokuixa-meta
// meta【一括兵士訓練】上記を参考にしました
 
(function () {
  
  // meta
  function meta($) {
    //■ プロトタイプ {
    var XRWstext = function(xhr) {
      return xhr.setRequestHeader('X-Requested-With', 'statusText');
    };
    //. String.prototype
    $.extend(String.prototype, {
      //.. toInt
      toInt: function() {
        return parseInt(this.replace(/,/g, ''), 10);
      },
      //.. toFloat
      toFloat: function() {
        return parseFloat(this.replace(/,/g, ''));
      },
      //.. repeat
      repeat: function(num) {
        var str = this,
          result = '';
        for (; num > 0; num >>>= 1, str += str) {
          if (num & 1) {
            result += str;
          }
        }
        return result;
      },
      //.. getTime - yyyy-mm-dd hh:mi:ss
      getTime: function() {
        if (!/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(this)) {
          throw new Error('Invalid string');
        }
        var date = this.replace(/-/g, '/');
        return ~~(new Date(date).getTime() / 1000);
      }
    });

    //. Number.prototype
    $.extend(Number.prototype, {
      //.. toInt
      toInt: function() {
        return this;
      },
      //.. toFloat
      toFloat: function() {
        return this;
      },
      //.. toRound
      toRound: function(decimal) {
        decimal = (decimal === undefined) ? 0 : decimal;
        var num = Math.pow(10, decimal);
        return Math.round(this * num) / num;
      },
      //.. toFloor
      toFloor: function(decimal) {
        decimal = (decimal === undefined) ? 0 : decimal;
        var num = Math.pow(10, decimal);
        return Math.floor(this * num) / num;
      },
      //.. toFormatNumber - 9,999,999
      toFormatNumber: function(decimal, replaceNaN) {
        decimal = (decimal === undefined) ? 0 : decimal;
        if (isNaN(this)) {
          return replaceNaN || '';
        }
        var num = this.toFloor(decimal),
          result = num.toString();
        while (result != (result = result.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
        if (decimal > 0 && num % 1 === 0) {
          result += '.' + '0'.repeat(decimal);
        }
        return result;
      },
      //.. toFormatDate - 0000/00/00 00:00:00
      toFormatDate: function(format) {
        var date = new Date(this * 1000);
        return date.toFormatDate(format);
      },
      //.. toFormatTime - 00:00:00
      toFormatTime: function(format) {
        format = format || 'hh:mi:ss';
        var h, m, s;
        if (this <= 0) {
          h = m = s = 0;
        } else {
          h = Math.floor(this / 3600);
          m = Math.floor((this - (h * 3600)) / 60);
          s = Math.floor(this - (h * 3600) - (m * 60));
        }
        if (h >= 100) {
          format = format.replace('hh', h);
        } else {
          format = format.replace('hh', ('00' + h).substr(-2));
        }
        format = format.replace('mi', ('00' + m).substr(-2));
        format = format.replace('ss', ('00' + s).substr(-2));
        return format;
      }
    });

    //. Date.prototype
    $.extend(Date.prototype, {
      //.. toFormatDate - 0000/00/00 00:00:00
      toFormatDate: function(format) {
        format = format || 'yyyy/mm/dd hh:mi:ss';
        format = format.replace('yyyy', this.getFullYear());
        format = format.replace('mm', this.getMonth() + 1);
        format = format.replace('dd', this.getDate());
        format = format.replace('hh', ('00' + this.getHours()).substr(-2));
        format = format.replace('mi', ('00' + this.getMinutes()).substr(-2));
        format = format.replace('ss', ('00' + this.getSeconds()).substr(-2));
        return format;
      }
    });
    // } プロトタイプ

    //. Array.prototype
    $.extend(Array.prototype, {
      //.. unique
      unique: function() {
        var result = [],
          temp = {};
        for (var i = 0, len = this.length; i < len; i++) {
          if (!temp[this[i]]) {
            temp[this[i]] = true;
            result.push(this[i]);
          }
        }
        return result;
      },
      //.. reduce
      reduce: function reduce(accumulator) {
        if (!this) {
          throw new TypeError("Object is null or undefined");
        }
        var i = 0,
          l = this.length >> 0,
          curr;
        if (typeof(accumulator) !== 'function') {
          // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
          throw new TypeError("First argument is not callable");
        }
        if (arguments.length < 2) {
          if (l === 0) {
            throw new TypeError("Array length is 0 and no second argument");
          }
          curr = this[0];
          i = 1; // start accumulating at the second element
        } else {
          curr = arguments[1];
        }
        while (i < l) {
          if (i in this) {
            curr = accumulator.call(undefined, curr, this[i], i, this);
          }
          ++i;
        }
        return curr;
      }
    });

    //■ MetaStorage {
    var MetaStorage = (function() {
      var storageList = {},
        storagePrefix = 'IM.',
        eventListener = {},
        propNames = 'expires'.split(' ');
        
      function MetaStorage(name) {
        var storageName = storagePrefix + name,
          storage, storageArea;
        storageArea = MetaStorage.keys[storageName];
        if (!storageArea) {
          throw new Error('「' + storageName + '」このストレージ名は存在しません。');
        }
        storage = storageList[storageName];
        if (storage === undefined) {
          storage = new Storage(storageArea, storageName);
          loadData.call(storage);
          storageList[storageName] = storage;
        }
        return storage;
      }
      $.extend(MetaStorage, {
        keys: {},
        registerStorageName: function(storageName) {
          storageName = storagePrefix + storageName;
          MetaStorage.keys[storageName] = 'local';
        },
        registerSessionName: function(storageName) {
          storageName = storagePrefix + storageName;
          MetaStorage.keys[storageName] = 'session';
        },
        clearAll: function() {
          $.each(MetaStorage.keys, function(key, value) {
            localStorage.removeItem(key);
          });
          storageList = {};
        },
        import: function(string) {
          var importData = JSON.parse(string),
            keys = MetaStorage.keys;
          this.clearAll();
          $.each(importData, function(key, value) {
            if (keys[key]) {
              localStorage.setItem(key, importData[key]);
            }
          });
        },
        export: function() {
          var exportData = {};
          $.each(MetaStorage.keys, function(key, value) {
            var stringData = localStorage.getItem(key);
            if (stringData) {
              exportData[value] = stringData;
            }
          });
          return JSON.stringify(exportData);
        },
        change: function(name, callback) {
          var storageName = storagePrefix + name;
          $(eventListener).on(storageName, callback);
        }
      });
      
      function Storage(storageArea, storageName) {
        this.storageArea = storageArea;
        this.storageName = storageName;
        this.data = {};
        return this;
      }
      $.extend(Storage.prototype, {
        clear: function() {
          this.data = {};
          clearData.call(this);
        },
        get: function(key) {
          return this.data[key];
        },
        set: function(key, value) {
          this.data[key] = value;
          saveData.call(this);
        },
        remove: function(key) {
          delete this.data[key];
          saveData.call(this);
        },
        begin: function() {
          this.transaction = true;
          this.tranData = $.extend({}, this.data);
        },
        commit: function() {
          var trans = this.transaction;
          delete this.transaction;
          delete this.tranData;
          if (trans) {
            saveData.call(this);
          }
        },
        rollback: function() {
          delete this.transaction;
          this.data = this.tranData;
          delete this.tranData;
        },
        toJSON: function() {
          return JSON.stringify(this.data);
        }
      });
      
      function loadData() {
        this.data = load(this.storageArea, this.storageName);
      }
      
      function saveData() {
        if (this.transaction) {
          return;
        }
        save(this.storageArea, this.storageName, this.data);
      }
      
      function clearData() {
        var storageArea;
        if (this.transaction) {
          return;
        }
        if (this.storageArea == 'local') {
          storageArea = localStorage;
        } else if (this.storageArea == 'session') {
          storageArea = sessionStorage;
        }
        storageArea.removeItem(this.storageName);
      }
      
      function load(storageArea, storageName) {
        var parseData = {},
          stringData, storage;
        if (storageArea == 'local') {
          storage = localStorage;
        } else if (storageArea == 'session') {
          storage = sessionStorage;
        }
        stringData = storage.getItem(storageName);
        if (stringData) {
          try {
            parseData = JSON.parse(stringData);
          } catch (e) {}
        }
        return parseData;
      }
      
      function save(storageArea, storageName, data) {
        var stringData = JSON.stringify(data),
          storage;
        if (storageArea == 'local') {
          storage = localStorage;
        } else if (storageArea == 'session') {
          storage = sessionStorage;
        }
        if ($.isEmptyObject(data)) {
          storage.removeItem(storageName);
        } else {
          storage.setItem(storageName, stringData);
        }
      }
      $(window).on('storage', function(event) {
        var storageName = event.originalEvent.key,
          storage;
        if (!MetaStorage.keys[storageName]) {
          return;
        }
        storage = storageList[storageName];
        if (storage !== undefined) {
          loadData.call(storage);
        }
        $(eventListener).trigger(storageName, event);
      });
      return MetaStorage;
    })();

    'ENVIRONMENT SETTINGS VILLAGE FACILITY ALLIANCE COUNTDOWN UNIT_STATUS USER_FALL USER_INFO FAVORITE_UNIT'.split(' ').forEach(function(value) {
      MetaStorage.registerStorageName(value);
    });
    '1 2 3 4 5 6 7 8 9 10 11 12 20 21'.split(' ').forEach(function(value) {
      MetaStorage.registerStorageName('COORD.' + value);
    });
    'UNION_CARD'.split(' ').forEach(function(value) {
      MetaStorage.registerSessionName(value);
    });
    MetaStorage.change('UNIT_STATUS', function(event, storageEvent) {
      $('#imi_unitstatus').trigger('update');
      $('#imi_raid_list').trigger('update');
      $('#imi_basename').trigger('update');
    });
    // } MetaStorage

    //■ Env {
    var Env = (function() {
      var ixamoko_login_data = localStorage.ixamoko_login_data,
        login_data = ixamoko_login_data ? JSON.parse(ixamoko_login_data) : {};
      var storage = MetaStorage('ENVIRONMENT'),
        $server = $('#server_time'),
        $war = $('.situationWorldTable'),
        world = (location.hostname.slice(0, 4).match(/[ -~]+/) || [])[0],
        start = (document.cookie.match(new RegExp('im_st=(\\d+)')) || [])[1] || login_data.time,
        login = false,
        season, newseason, chapter, war, server_time, local_time, timeDiff, endtime;
      //storageから取得
      endtime = storage.get('endtime');
      season = storage.get('season');
      chapter = storage.get('chapter');
      if ($server.length === 0) {
        timeDiff = 0;
      } else {
        //鯖との時差取得
        server_time = new Date($server.text().replace(/-/g, '/')).getTime();
        local_time = new Date().getTime();
        timeDiff = (server_time - local_time);
      }
      if (world && start) {
        login = true;
        //moko設定から取得
        newseason = login_data.season;
        chapter = login_data.chapter;
        //鯖との時差も含めてタイムアウト時間を設定（カウントダウンで鯖時間を使用する為）
        endtime = start.toInt() + (3 * 60 * 60) + Math.floor(timeDiff / 1000);
        newseason = newseason.toInt();
        chapter = chapter.toInt();
        storage.begin();
        storage.set('endtime', endtime);
        storage.set('season', newseason);
        storage.set('chapter', chapter);
        storage.commit();
        document.cookie = world + '_st=0; expires=Fri, 31-Dec-1999 23:59:59 GMT; domain=.sengokuixa.jp; path=/;';
        document.cookie = world + '_s=0; expires=Fri, 31-Dec-1999 23:59:59 GMT; domain=.sengokuixa.jp; path=/;';
        document.cookie = world + '_c=0; expires=Fri, 31-Dec-1999 23:59:59 GMT; domain=.sengokuixa.jp; path=/;';
        if (newseason !== season) {
          //期が変わった場合
          'VILLAGE FACILITY ALLIANCE COUNTDOWN UNIT_STATUS USER_FALL USER_INFO FAVORITE_UNIT'.split(' ').forEach(function(value) {
            MetaStorage(value).clear();
          });
          '1 2 3 4 5 6 7 8 9 10 11 12 20 21'.split(' ').forEach(function(value) {
            MetaStorage('COORD.' + value).clear();
          });
          season = newseason;
        }
      }
      if ($war.find('IMG[src$="icon_warnow_new.png"]').length > 0) {
        war = 2;
      } else if ($war.find('IMG[src$="icon_warnow.png"]').length > 0) {
        war = 1;
      } else {
        war = 0;
      }
      if (login && war === 0) {
        MetaStorage('USER_FALL').clear();
        MetaStorage('USER_INFO').clear();
      }
      return {
        //. loginProcess
        loginProcess: login,
        //. world - 鯖
        world: world,
        //. season - 期
        season: season,
        //. chapter - 章
        chapter: chapter,
        //. war - 合戦 0:無し 1:通常合戦 2:新合戦
        war: war,
        //. timeDiff - 鯖との時差
        timeDiff: timeDiff,
        //. path - アクセスパス
        path: location.pathname.match(/[^\/]+(?=(\/|\.))/g) || [],
        //. externalFilePath - 外部ファイルへのパス
        externalFilePath: (function() {
          var href = $('LINK[type="image/x-icon"][href^="http://cache"]').attr('href') || '';
          href = href.match(/^.+(?=\/)/) || '';
          return href;
        })(),
        //. loginState - ログイン状態
        loginState: (function() {
          var path = location.pathname;
          if ($('#lordName').length == 1) {
            return 1;
          }
          if (path == '/world/select_world.php') {
            return 0;
          }
          if (path == '/user/first_login.php') {
            return 0;
          }
          if (path == '/false/login_sessionout.php') {
            return -1;
          }
          if (path == '/maintenance/') {
            return -1;
          }
          return -1;
        })(),
        //. endtime - タイムアウト期限
        endtime: endtime,
        //. ajax - 一部のajax通信の判定に使用
        ajax: false
      };
    })();
    // } Env

    //■ BaseList {
    var BaseList = (function() {
      //. base
      function base(country) {
        var list = [],
          colors = MiniMap.colors.type1;
        $('#imi_basename .imc_basename LI > *:first-child').each(function() {
          var name = $(this).text().trim(),
            village = Util.getVillageByName(name);
          if (!village) {
            return;
          }
          if (village.country != country) {
            return;
          }
          if (colors[village.type]) {
            list.push({
              type: 0,
              id: village.id,
              name: name,
              x: village.x,
              y: village.y,
              color: colors[village.type]
            });
          }
        });
        return list;
      }
      //. home
      function home() {
        var list = [];
        $('.sideBoxInner.basename LI > *:first-child').each(function() {
          var name = $(this).text().trim(),
            village = Util.getVillageByName(name);
          if (!village) {
            return;
          }
          list.push({
            type: 0,
            id: village.id,
            name: name,
            x: village.x,
            y: village.y,
            color: '#0f0'
          });
        });
        return list;
      }
      //. away
      function away() {
        var list = [];
        $('#imi_basename .imc_basename.imc_away LI > *:first-child').each(function() {
          var name = $(this).text().trim(),
            village = Util.getVillageByName(name);
          if (!village) {
            return;
          }
          list.push({
            type: 0,
            id: village.id,
            name: name,
            x: village.x,
            y: village.y,
            color: '#0f0'
          });
        });
        return list;
      }
      //. coords
      function coords(country) {
        var list = [],
          map_list = MetaStorage('COORD.' + country).data;
        for (var key in map_list) {
          var point = key.match(/(-?\d+),(-?\d+)/),
            x = point[1].toInt(),
            y = point[2].toInt();
          list.push({
            type: 2,
            id: null,
            name: map_list[key],
            x: x,
            y: y,
            color: '#ff0'
          });
        }
        return list;
      }
      //. return
      return {
        all: function(country) {
          var list = [];
          list = $.merge(list, base(country));
          return list;
        },
        home: home,
        home_away: function() {
          var list = [];
          list = $.merge(list, home());
          list = $.merge(list, away());
          return list;
        }
      };
    })();
    // BaseList }
    
    //■ Soldier {
    var Soldier = (function() {
      var data = {
        //槍
        '足軽':     { type: 321, class: 'yari1', attack: 11, defend: 11, speed: 15, destroy:  2, command: '槍', skillType: '槍', training: [  90, 73, 59, 48, 39, 32, 26, 22, 18, 15, 13, 11,  9,  8, 7 ], dou:   0, require: ['槍', '槍'], order: 1 },
        '長槍足軽': { type: 322, class: 'yari2', attack: 16, defend: 16, speed: 16, destroy:  2, command: '槍', skillType: '槍', training: [ 105, 85, 69, 56, 45, 37, 30, 25, 21, 17, 14, 12, 11,  9, 8 ], dou:  10, require: ['槍', '槍'], order: 2 },
        '武士':     { type: 323, class: 'yari3', attack: 18, defend: 18, speed: 18, destroy:  3, command: '槍', skillType: '槍', training: [ 120, 97, 78, 63, 51, 42, 34, 28, 23, 19, 16, 14, 12, 10, 9 ], dou: 200, require: ['槍', '弓'], order: 3 },
        '国人衆':   { type: 324, class: 'yari4', attack: 17, defend: 17, speed: 19, destroy:  4, command: '槍', skillType: '槍', training: [], dou:   0, require: ['槍', '槍'], order: 0 },
        //弓
        '弓足軽':   { type: 325, class: 'yumi1', attack: 10, defend: 12, speed: 16, destroy:  1, command: '弓', skillType: '弓', training: [  95,  77, 62, 51, 41, 34, 28, 23, 19, 16, 13, 11, 10,  9, 8 ], dou:   0, require: ['弓', '弓'], order: 1 },
        '長弓兵':   { type: 326, class: 'yumi2', attack: 15, defend: 17, speed: 18, destroy:  1, command: '弓', skillType: '弓', training: [ 110,  89, 72, 58, 47, 39, 32, 26, 21, 18, 15, 13, 11,  9, 8 ], dou:  10, require: ['弓', '弓'], order: 2 },
        '弓騎馬':   { type: 327, class: 'yumi3', attack: 17, defend: 19, speed: 23, destroy:  1, command: '弓', skillType: '弓', training: [ 125, 101, 82, 66, 53, 43, 35, 29, 24, 20, 17, 14, 12, 10, 9 ], dou: 200, require: ['弓', '馬'], order: 3 },
        '海賊衆':   { type: 328, class: 'yumi4', attack: 16, defend: 17, speed: 20, destroy:  2, command: '弓', skillType: '弓', training: [], dou:   0, require: ['弓', '弓'], order: 0 },
        //馬
        '騎馬兵':   { type: 329, class: 'kiba1', attack: 12, defend: 10, speed: 22, destroy:  1, command: '馬', skillType: '馬', training: [ 100,  81, 66, 53, 43, 35, 29, 24, 20, 17, 14, 12, 10,  9, 8 ], dou:   0, require: ['馬', '馬'], order: 1 },
        '精鋭騎馬': { type: 330, class: 'kiba2', attack: 17, defend: 15, speed: 23, destroy:  1, command: '馬', skillType: '馬', training: [ 115,  93, 75, 61, 49, 40, 33, 27, 22, 19, 16, 13, 11, 10, 8 ], dou:  10, require: ['馬', '馬'], order: 2 },
        '赤備え':   { type: 331, class: 'kiba3', attack: 21, defend: 20, speed: 25, destroy:  1, command: '馬', skillType: '馬', training: [ 130, 105, 85, 69, 56, 45, 37, 30, 25, 21, 17, 14, 12, 10, 9 ], dou: 200, require: ['馬', '槍'], order: 3 },
        '母衣衆':   { type: 332, class: 'kiba4', attack: 19, defend: 16, speed: 24, destroy:  2, command: '馬', skillType: '馬', training: [], dou:   0, require: ['馬', '馬'], order: 0 },
        //器
        '破城鎚':   { type: 333, class: 'heiki1', attack:  3, defend:  8, speed:  8, destroy: 10, command: '器', skillType: '器', training: [ 195, 157, 126, 102,  82, 66, 54, 44, 36, 29, 24, 20, 17, 14, 12 ], dou:  10, require: ['器', '器'], order: 1 },
        '攻城櫓':   { type: 334, class: 'heiki2', attack: 14, defend:  5, speed: 10, destroy:  7, command: '器', skillType: '器', training: [ 195, 157, 126, 102,  82, 66, 54, 44, 36, 29, 24, 20, 17, 14, 12 ], dou:  10, require: ['器', '器'], order: 2 },
        '大筒兵':   { type: 335, class: 'heiki3', attack: 10, defend: 12, speed:  8, destroy: 20, command: '器', skillType: '器', training: [ 270, 217, 174, 140, 113, 91, 73, 59, 48, 39, 32, 26, 22, 18, 15 ], dou: 300, require: ['弓', '器'], order: 3 },
        '鉄砲足軽': { type: 336, class: 'heiki4', attack: 18, defend: 26, speed: 15, destroy:  1, command: '器', skillType: '砲', training: [ 180, 145, 117,  94,  76, 61, 50, 41, 33, 27, 23, 19, 16, 13, 11 ], dou: 200, require: ['槍', '器'], order: 5 },
        '騎馬鉄砲': { type: 337, class: 'heiki5', attack: 26, defend: 18, speed: 21, destroy:  1, command: '器', skillType: '砲', training: [ 250, 201, 162, 130, 105, 84, 68, 55, 45, 37, 30, 25, 20, 17, 14 ], dou: 300, require: ['馬', '器'], order: 6 },
        '雑賀衆':   { type: 338, class: 'heiki6', attack: 23, defend: 17, speed: 18, destroy:  5, command: '器', skillType: '砲', training: [], dou:   0, require: ['槍', '器'], order: 0 },
        '焙烙火矢': { type: 345, class: 'heiki7', attack: 23, defend: 23, speed: 19, destroy:  2, command: '器', skillType: '砲', training: [ 250, 201, 162, 130, 105, 84, 68, 55, 45, 37, 30, 25, 20, 17, 14 ], dou:  10, require: ['弓', '器'], order: 4 },
        //NPC用
        '浪人':     { defend:  12, command: '槍' },
        '抜け忍':   { defend:  12, command: '弓' },
        '野盗':     { defend:  12, command: '馬' },
        '農民':     { defend:   5, command: '他' },
        '鬼':       { defend:  88, command: '他' },
        '天狗':     { defend: 112, command: '他' }
      };
      
      var rankRate = {
        'SSS': 120,
        'SS': 115,
        'S': 110,
        'A': 105,
        'B': 100,
        'C': 95,
        'D': 90,
        'E': 85,
        'F': 80
      };
      
      function Soldier() {
        return $.extend({}, data);
      }
      
      $.extend(Soldier, {
        nameKeys: {},
        typeKeys: {},
        classKeys: {},
        //. getByName
        getByName: function(name) {
          name = (name == '鉄砲騎馬') ? '騎馬鉄砲' : name;
          return data[name];
        },
        //. getByType
        getByType: function(type) {
          var name = Soldier.typeKeys[type];
          return this.getByName(name);
        },
        //. getByClass
        getByClass: function(className) {
          var name = this.getNameByClass(className);
          return this.getByName(name);
        },
        //. getNameByType
        getNameByType: function(type) {
          return Soldier.typeKeys[type] || '';
        },
        //. getNameByClass
        getNameByClass: function(className) {
          className = (className.split('_') || [])[1];
          return Soldier.classKeys[className] || '';
        },
        //. getType
        getType: function(name) {
          return Soldier.nameKeys[name] || null;
        },
        //. modify
        modify: function(name, commands) {
          var data = Soldier.getByName(name),
            modRate = 0;
          if (!data) return 0;
          modRate += rankRate[commands[data.require[0]]];
          modRate += rankRate[commands[data.require[1]]];
          return modRate / 2;
        }
      });
      
      $.each(data, function(key, value) {
        value.name = key;
        if (value.type) {
          Soldier.nameKeys[key] = value.type;
          Soldier.typeKeys[value.type] = key;
          Soldier.classKeys[value.class] = key;
        }
      });
      return Soldier;
    })();
    // Soldier }

    //■ Util {
    var Util = {
      //. getLocalTime
      getLocalTime: function() {
        return ~~(new Date().getTime() / 1000);
      },
      //. getServerTime
      getServerTime: function() {
        return ~~((new Date().getTime() + Env.timeDiff) / 1000);
      },
      //. getVillageByName
      getVillageByName: function(name) {
        var list = MetaStorage('VILLAGE').get('list') || [],
          i, len;
        for (i = 0, len = list.length; i < len; i++) {
          if (list[i].name != name) {
            continue;
          }
          return list[i];
        }
        //キャッシュで見つからない場合は最新情報取得
        list = Util.getVillageList();
        for (i = 0, len = list.length; i < len; i++) {
          if (list[i].name != name) {
            continue;
          }
          return list[i];
        }
        return null;
      },
      //. getVillageById
      getVillageById: function(id) {
        var list = MetaStorage('VILLAGE').get('list') || [],
          i, len;
        for (i = 0, len = list.length; i < len; i++) {
          if (list[i].id != id) {
            continue;
          }
          return list[i];
        }
        //キャッシュで見つからない場合は最新情報取得
        list = Util.getVillageList();
        for (i = 0, len = list.length; i < len; i++) {
          if (list[i].id != id) {
            continue;
          }
          return list[i];
        }
        return null;
      },
      //. getVillageList
      getVillageList: function() {
        var list = [];
        $.ajax({
          type: 'get',
          url: '/user/',
          async: false,
          beforeSend: XRWstext
        })
        .done(function(html) {
          var $html = $(html),
            $table = $html.find('TABLE.common_table1');
          //本領所領
          $table.eq(0).find('TR.fs14').each(function() {
            var $this = $(this),
              type = $this.find('TD').eq(0).text(),
              $a = $this.find('A'),
              name = $a.eq(0).text().trim(),
              id = $a.eq(0).attr('href').match(/village_id=(\d+)/)[1],
              point = $a.eq(1).attr('href').match(/x=(-?\d+)&y=(-?\d+)&c=(\d+)/),
              x = point[1].toInt(),
              y = point[2].toInt(),
              country = point[3].toInt(),
              fall = $this.find('TD').eq(4).find('.red').length;
            list.push({
              type: type,
              id: id,
              name: name,
              x: x,
              y: y,
              country: country,
              fall: fall
            });
          });
          //出城・陣・領地
          $table.eq(1).find('TR.fs14').each(function() {
            var $this = $(this),
              type = $this.find('TD').eq(0).text(),
              $a = $this.find('A'),
              name = $a.eq(0).text().trim(),
              id = $a.eq(0).attr('href').match(/village_id=(\d+)/)[1],
              point = $a.eq(1).attr('href').match(/x=(-?\d+)&y=(-?\d+)&c=(\d+)/),
              x = point[1].toInt(),
              y = point[2].toInt(),
              country = point[3].toInt(),
              fall = $this.find('TD').eq(4).find('.red').length;
            list.push({
              type: type,
              id: id,
              name: name,
              x: x,
              y: y,
              country: country,
              fall: fall
            });
          });
          MetaStorage('VILLAGE').set('list', list);
        });
        return list;
      },
      //. getVillageCurrent
      getVillageCurrent: function() {
        var name = $('.sideBoxInner.basename .on > SPAN').text();
        return Util.getVillageByName(name);
      },
      //. getVillageChangeUrl
      getVillageChangeUrl: function(village_id, returnUrl) {
        return '/village_change.php?village_id=' + village_id + '&from=menu&page=' + encodeURIComponent(returnUrl);
      },
      //. getPoolSoldiers
      getPoolSoldiers: function() {
        var data = {};
        $.ajax({
          type: 'get',
          url: '/facility/unit_list.php',
          async: false,
          beforeSend: XRWstext
        })
        .pipe(function(html) {
          var $html = $(html),
            $table, $cell, text;
          text = $html.find('.ig_solder_commentarea').text().split('/')[1].trim();
          data.capacity = text.toInt();
          data.soldier = $html.find('#all_pool_unit_cnt').text().toInt();
          data.pool = {};
          data.training = [];
          $table = $html.find('.ig_fight_dotbox');
          $table.first().find('TH').each(function() {
            var $this = $(this),
              type = Soldier.getType($this.text()),
              pool = $this.next().text().toInt();
            data.pool[type] = pool;
          });
          $table.eq(1).find('.table_fightlist2').each(function() {
            var $tr = $(this).find('TR'),
              name = $tr.first().find('A').text(),
              village = Util.getVillageByName(name);
            $tr.slice(1).each(function() {
              var $td = $(this).find('TD'),
                type = Soldier.getType($td.eq(0).find('IMG').attr('alt')),
                num = $td.eq(1).text().toInt(),
                finish = $td.eq(3).text().getTime();
              data.training.push({
                id: village.id,
                type: type,
                num: num,
                finish: finish
              });
            });
          });
        });
        return data;
      },
      //. getConsumption
      getConsumption: function(materials, number) {
        var modRate = 1,
          idx;
        if (number >= 5) {
          idx = Math.floor(number / 10);
          if (idx > 10) {
            idx = 10;
          }
          modRate = [0.98, 0.96, 0.94, 0.94, 0.94, 0.92, 0.92, 0.92, 0.92, 0.92, 0.90][idx];
        }
        return materials.map(function(value) {
          return (value * modRate).toRound(0) * number;
        });
      },
      //. getFacility
      getFacility: function(name) {
        var data = MetaStorage('FACILITY').data,
          list = [];
        (function() {
          var facility_list, village, facility;
          for (var vid in data) {
            facility_list = data[vid];
            village = Util.getVillageById(vid);
            if (!village) {
              continue;
            }
            if (facility_list[name] && facility_list[name].lv >= 1) {
              facility = $.extend({
                id: vid,
                name: village.name
              }, facility_list[name]);
              list.push(facility);
            }
          }
        })();
        return list;
      },
      //. getMarket
      getMarket: function() {
        var rates = [0, 0.4, 0.42, 0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56, 0.60],
          list = Util.getFacility('市'),
          market;
        if (list.length === 0) {
          return null;
        }
        list.sort(function(a, b) {
          return (b.lv > a.lv);
        });
        list[0].rate = rates[list[0].lv];
        return list[0];
      },
      //. getResource
      getResource: function() {
        return [
          $('#wood').text().toInt(),
          $('#stone').text().toInt(),
          $('#iron').text().toInt(),
          $('#rice').text().toInt()
        ];
      },
      //. getUranai
      getUranai: function() {
        var $img = $('.rightF IMG');
        if ($img.length === 0) {
          return [1, 1, 1];
        }
        return $img.map(function() {
          return (100 - $(this).attr('alt').match(/\d/)[0].toInt()) / 100;
        });
      },
      //. checkExchange
      checkExchange: function(resource, requirements, rate) {
        var shortage = 0,
          surplus = 0;
        if (isNaN(rate)) {
          rate = (Util.getMarket() || {
            rate: 0
          }).rate;
        }
        for (var i = 0, len = resource.length; i < len; i++) {
          if (resource[i] >= requirements[i]) {
            surplus += resource[i] - requirements[i];
          } else {
            shortage += requirements[i] - resource[i];
          }
        }
        return (shortage === 0) ? 2 : (surplus * rate >= shortage) ? 1 : 0;
      },
      //. getExchangePlan
      getExchangePlan: function(resource, requirements, rate, type) {
        var surplus = [],
          shortage = [],
          totalSurplus, totalShortage;
        '木 綿 鉄 糧'.split(' ').forEach(function(type, idx) {
          var value = resource[idx] - requirements[idx];
          if (value > 0) {
            surplus.push({
              type: type,
              value: value
            });
          } else if (value < 0) {
            shortage.push({
              type: type,
              value: -value
            });
          }
        });
        totalSurplus = surplus.reduce(function(prev, curr) {
          return prev += curr.value;
        }, 0);
        totalShortage = shortage.reduce(function(prev, curr) {
          return prev += curr.value;
        }, 0);
        totalShortage = Math.ceil(totalShortage / rate);
        if (totalSurplus < totalShortage) {
          return [];
        }
        if (type == 'A') {
          var modify = surplus.sort(function(a, b) {
            return (b.value > a.value);
          })
          .reduce(function(prev, curr, idx) {
            if (curr.value > prev.avg) {
              prev.value = prev.value + curr.value;
              prev.avg = Math.floor((prev.value - totalShortage) / (idx + 1));
            }
            return prev;
          }, {
            value: 0,
            avg: 0
          });
          totalSurplus = 0;
          surplus = surplus.map(function(elem) {
            elem.value -= modify.avg;
            if (elem.value < 0) {
              elem.value = 0;
            }
            totalSurplus += elem.value;
            return elem;
          });
        }
        surplus = surplus.map(function(elem) {
          elem.ratio = elem.value / totalSurplus;
          return elem;
        });
        var plans = [];
        shortage.forEach(function(short) {
          surplus.forEach(function(plus) {
            var value = Math.ceil(short.value * plus.ratio),
              fixed;
            if (value === 0) {
              return;
            }
            fixed = Math.floor((value - 1) / rate) + 1;
            value = Math.floor(value / rate);
            if (Math.ceil(value * rate) == Math.ceil(fixed * rate)) {
              value = fixed;
            }
            if (value < 10) {
              value = 10;
            }
            plans.push({
              from: plus.type,
              to: short.type,
              value: value,
              receive: Math.ceil(value * rate)
            });
          });
        });
        return plans;
      },
      //. getValidSoldiers
      getValidSoldiers: function(facility) {
        var url = Util.getVillageChangeUrl(facility.id, '/facility/facility.php?x=' + facility.x + '&y=' + facility.y),
          soldiers = [];
        $.ajax({
          type: 'get',
          url: url,
          async: false,
          beforeSend: XRWstext
        })
        .pipe(function(html) {
          var $html = $(html),
            idx = 0;
          if ($html.find('DIV[id^="TrainingBlock"]').length) {
            idx = 1;
          }
          $html.find('.ig_tilesection_innermid, .ig_tilesection_innermid2').each(function() {
            var $this = $(this),
              name, materials, soldata, $div, str;
            $div = $this.closest('DIV[id^="TrainingBlock"]');
            str = $div.find('DIV.ig_decksection_top').text();
            if (str == '高速訓練' || str == '上位訓練') {
              return;
            }
            if ($this.find('H3').length === 0) {
              return;
            }
            if ($this.find('H3 A').length > 0) {
              return;
            }
            name = $this.find('H3').text().match(/\[(.*)\]/)[1];
            materials = [
              $this.find('.icon_wood').text().match(/(\d+)/)[1].toInt(),
              $this.find('.icon_cotton').text().match(/(\d+)/)[1].toInt(),
              $this.find('.icon_iron').text().match(/(\d+)/)[1].toInt(),
              $this.find('.icon_food').text().match(/(\d+)/)[1].toInt()
            ];
            soldata = Soldier.getByName(name);
            image = $this.find('.ig_tilesection_iconarea IMG').attr('src');
            soldiers.push({
              type: soldata.type,
              name: name,
              materials: materials,
              training: soldata.training,
              image: image,
              order: soldata.order
            });
          });
        });
        return soldiers.reverse();
      },
      //. getMaxTraining
      getMaxTraining: function(resource, requirements, rate, max, min) {
        var c, materials, check, result = min;
        while (min <= max) {
          c = Math.floor((max + min) / 2);
          materials = Util.getConsumption(requirements, c);
          check = Util.checkExchange(resource, materials, rate);
          if (check === 0) {
            max = c - 1;
          } else {
            result = c;
            min = c + 1;
          }
        }
        return result;
      },
      //. divide
      divide: function(list, soldata, solnum) {
        var uranai = Util.getUranai(),
          facilities = [],
          maxidx = 0,
          total = 0,
          soltotal = 0;
        (function() {
          var i, facility;
          for (i = 0, len = list.length; i < len; i++) {
            facility = $.extend({
              type: soldata.type
            }, list[i]);
            facility.rate = soldata.training[0] / soldata.training[facility.lv - 1];
            total += facility.rate;
            facilities.push(facility);
          }
        })();
        if (facilities.length == 1) {
          //施設が１つの場合、分配しない
          facilities[0].solnum = solnum;
        } else {
          (function() {
            var i, facility;
            for (i = 0, len = facilities.length; i < len; i++) {
              facility = facilities[i];
              facility.rate = facility.rate / total;
              facility.solnum = Math.floor(solnum * facility.rate);
              soltotal += facility.solnum;
              if (facility.lv > facilities[maxidx].lv) {
                maxidx = i;
              }
            }
          })();
          if (soltotal != solnum) {
            //小数点以下を切り捨てているので、不足分はLVが一番高い施設で調整
            facilities[maxidx].solnum += (solnum - soltotal);
          }
        }
        (function() {
          var i, facility;
          for (i = 0, len = facilities.length; i < len; i++) {
            facility = facilities[i];
            facility.materials = Util.getConsumption(soldata.materials, facility.solnum);
            facility.trainingtime = Math.floor(facility.solnum * soldata.training[facility.lv - 1] * uranai[1]);
          }
        })();
        return facilities;
      },
      //. divide2
      divide2: function(list, soldata, time) {
        var uranai = Util.getUranai(),
          facilities = [],
          total = 0;
        (function() {
          var facility;
          for (var i = 0, len = list.length; i < len; i++) {
            facility = $.extend({
              type: soldata.type
            }, list[i]);
            facility.solnum = Math.floor(time / soldata.training[facility.lv - 1] / uranai[1]);
            facility.trainingtime = Math.floor(facility.solnum * soldata.training[facility.lv - 1] * uranai[1]);
            facility.materials = Util.getConsumption(soldata.materials, facility.solnum);
            total += facility.solnum;
            facilities.push(facility);
          }
        })();
        facilities.totalnum = total;
        return facilities;
      },
      //. wait
      wait: function(ms) {
        var dfd = $.Deferred();
        window.setTimeout(function() {
          dfd.resolve();
        }, ms);
        return dfd;
      }
    };
    // Util }

    //■ Display {
    var Display = (function() {
      var $sysmessage;
      
      function Dialog(options) {
        var $overlay = $('<div id="imi_overlay"><div class="imc_overlay" /><div id="imi_dialog_container" /></div>'),
          $container = $overlay.find('#imi_dialog_container'),
          self = this,
          $body, $footer;
        options = $.extend({
          width: 500,
          height: 200,
          top: '25%'
        }, options);
        $overlay.appendTo('BODY');
        if (options.title) {
          $container.append('<div class="imc_dialog_header">' + options.title + '</div>');
        }
        $body = $('<div class="imc_dialog_body" />');
        $container.append($body);
        if (options.content) {
          $body.append(options.content);
        }
        if (options.buttons) {
          $footer = $('<div class="imc_dialog_footer" />');
          $.each(options.buttons, function(key, callback) {
            $footer.append($('<button/>').text(key).click(function() {
              if (!$(this).attr('disabled')) {
                callback.call(self);
              }
            }));
          });
          $container.append($footer);
          this.buttons = $footer.find('BUTTON');
        }
        $container.css('top', options.top);
        $container.css('width', options.width);
        $body.css('height', options.height);
        this.append = function() {
          $body.append(arguments[0]);
        };
        this.message = function(text) {
          var $div = $('<div class="imc_message">' + text + '</div>');
          $body.append($div);
          $body.scrollTop($body[0].scrollHeight);
          return this;
        };
        this.close = function() {
          $overlay.remove();
        };
        return this;
      }
      
      function show(msg, sound, timeout, cssClass) {
        if (!$sysmessage) {
          $sysmessage = $('<div class="imc_dialog" />').appendTo(document.body);
        }
        var $span = $('<span/>').addClass('imc_dialog_content').addClass(cssClass).html(msg).appendTo(document.body);
        $span.width($span.outerWidth()).css('display', 'block').appendTo($sysmessage);
        timeout = timeout || 3000;
        window.setTimeout(function() {
          remove($span);
        }, timeout);
        if (sound && Data.sounds.info) {
          var audio = new Audio(Data.sounds.info);
          audio.volume = 0.6;
          audio.play();
        }
      }
      
      function remove($span) {
        $span.remove();
        if ($sysmessage.children().length === 0) {
          $sysmessage.remove();
          $sysmessage = null;
        }
      }
      //. return
      return {
        info: function(msg, sound, timeout) {
          show(msg, sound, timeout, 'imc_infomation');
        },
        alert: function(msg, sound, timeout) {
          sound = (sound === undefined) ? true : sound;
          show(msg, sound, timeout, 'imc_alert');
        },
        dialog: function(options) {
          return new Dialog(options);
        }
      };
    })();

    $.extend(Display, {
      //. dialogExchange
      dialogExchange: function(resource, requirements, currentVillage) {
        var market = Util.getMarket(),
          dfd = $.Deferred(),
          check, village, html, $html, dialog, plans;
        if (!market) {
          return dfd.reject();
        }
        village = Util.getVillageById(market.id);
        check = Util.checkExchange(resource, requirements, market.rate);
        html = '' +
        '<div id="imi_exchange_dialog">' +
        '<table class="imc_table">' +
          '<tr>' +
            '<th width="50">市拠点</th><td width="150">' + village.name + '</td>' +
            '<th width="50">LV</th><td width="30">' + market.lv + '</td>' +
            '<th width="50">相場</th><td width="30">' + (market.rate * 100).toRound(0) + '%</td>' +
          '</tr>' +
        '</table>' +
        '<br />' +
        '<table id="imi_ex_table" class="imc_table">' +
          '<tr><th></th>' +
            '<th><img src="' + Env.externalFilePath + '/img/common/ico_wood.gif' + '"></th>' +
            '<th><img src="' + Env.externalFilePath + '/img/common/ico_wool.gif' + '"></th>' +
            '<th><img src="' + Env.externalFilePath + '/img/common/ico_ingot.gif' + '"></th>' +
            '<th><img src="' + Env.externalFilePath + '/img/common/ico_grain.gif' + '"></th>' +
          '</tr>' +
          '<tr><th>現在資源量</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr><th>必要資源量</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr class="imc_sign"><th>過不足</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr class="imc_sign"><th>取引資源量</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr><td colspan="5" style="padding: 1px;"></td></tr>' +
          '<tr><th>取引後資源量</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr><th>必要資源量</th><td></td><td></td><td></td><td></td></tr>' +
          '<tr><td colspan="5" style="padding: 1px;"></td></tr>' +
          '<tr><th>消費後資源量</th><td></td><td></td><td></td><td></td></tr>' +
        '</table>' +
        '<br />' +
        '<table id="imi_ex_type" class="imc_table">' +
          '<tr><th rowspan="2" class="h100">変換タイプ</th><td class="imc_selected" data-type="A">タイプＡ</td><td>消費後資源量が平均的になるように取引資源量を決定</td></tr>' +
          '<tr><td data-type="B">タイプＢ</td><td>余剰資源量の割合に応じて取引資源量を決定</td></tr>' +
        '</table>' +
        '<br />' +
        '<div id="imi_exchange_message" />' +
        '</div>';

        $html = $(html)
        .on('metaupdate', function() {
          var $tr = $('#imi_ex_table').find('TR'),
            type = $(this).find('#imi_ex_type .imc_selected').data('type'),
            warehouse = $('#wood_max').text().toInt(),
            ex = [0, 0, 0, 0],
            button = true;
          plans = Util.getExchangePlan(resource, requirements, market.rate, type);
          plans.forEach(function(elem) {
            var idxTable = {
              '木': 0,
              '綿': 1,
              '鉄': 2,
              '糧': 3
            };
            ex[idxTable[elem.from]] -= elem.value;
            ex[idxTable[elem.to]] += elem.receive;
          });
          if (plans.length === 0 && check === 2) {
            $('#imi_exchange_message').text('取引の必要はありません');
            dialog.buttons.eq(0).text('処理続行');
          } else if (plans.length === 0 && check === 0) {
            $('#imi_exchange_message').text('資源が不足しています');
            button = false;
          }
          // 現在資源量
          $tr.eq(1).find('TD').each(function(idx) {
            $(this).text(resource[idx]);
          });
          // 必要資源量
          $tr.eq(2).find('TD').each(function(idx) {
            $(this).text(requirements[idx]);
          });
          // 過不足
          $tr.eq(3).find('TD').each(function(idx) {
            var $this = $(this),
              result = resource[idx] - requirements[idx];
            $this.text(result).removeClass('imc_surplus imc_shortage');
            if (result > 0) {
              $this.addClass('imc_surplus');
            }
            if (result < 0) {
              $this.addClass('imc_shortage');
            }
          });
          // 取引資源量
          $tr.eq(4).find('TD').each(function(idx) {
            var $this = $(this),
              result = ex[idx];
            $this.text(result).removeClass('imc_surplus imc_shortage');
            if (result > 0) {
              $this.addClass('imc_surplus');
            }
            if (result < 0) {
              $this.addClass('imc_shortage');
            }
          });
          // 取引後資源量
          $tr.eq(6).find('TD').each(function(idx) {
            var $this = $(this),
              result = resource[idx] + ex[idx];
            $this.text(result).removeClass('imc_over');
            if (result > warehouse) {
              $this.addClass('imc_over');
              $('#imi_exchange_message').text('取引後の資源量が蔵容量を超えています');
              button = false;
            }
          });
          // 必要資源量
          $tr.eq(7).find('TD').each(function(idx) {
            $(this).text(requirements[idx]);
          });
          // 消費後資源量
          $tr.eq(9).find('TD').each(function(idx) {
            var $this = $(this),
              result = resource[idx] + ex[idx] - requirements[idx];
            $this.text(result).removeClass('imc_surplus imc_shortage');
            if (result >= 0) {
              $this.addClass('imc_surplus');
            } else {
              $this.addClass('imc_shortage');
            }
          });
          dialog.buttons.eq(0).attr('disabled', !button);
        })
        .on('click', '#imi_ex_type TD', function() {
          $('#imi_ex_type').find('.imc_selected').removeClass('imc_selected');
          $(this).closest('TR').find('TD').first().addClass('imc_selected');
          $html.trigger('metaupdate');
        });

        dialog = Display.dialog({
          title: '市取引',
          width: 500,
          height: 340,
          top: 50,
          content: $html,
          buttons: {
            '取引を実行し処理続行': function() {
              var self = this,
                materialid = {
                  '木': 101,
                  '綿': 102,
                  '鉄': 103,
                  '糧': 104
                },
                ol;
              if (plans.length === 0 && check === 2) {
                dfd.resolve();
                self.close();
                return;
              }
              ol = Display.dialog();
              $.Deferred().resolve().pipe(function() {
                ol.message('取引開始...');
                var href = Util.getVillageChangeUrl(market.id, '/facility/facility.php?x=' + market.x + '&y=' + market.y);
                return $.ajax({
                  type: 'get',
                  url: href,
                  beforeSend: XRWstext
                });
              })
              .pipe(function(html) {
                if ($(html).find('#market_form').length === 0) {
                  Display.alert('市情報が見つかりませんでした。');
                  return $.Deferred().reject();
                }
              })
              .pipe(function() {
                if (plans.length === 0) {
                  return;
                }
                var self = arguments.callee,
                  plan = plans.shift();
                ol.message('【' + plan.from + '】' + plan.value + ' を【' + plan.to + '】' + plan.receive + 'と取引中...');
                $.ajax({
                  type: 'post',
                  url: '/facility/facility.php',
                  data: {
                    x: market.x,
                    y: market.y,
                    village_id: market.id,
                    tf_id: materialid[plan.from],
                    tc: plan.value,
                    tt_id: materialid[plan.to],
                    st: 1,
                    change_btn: true
                  },
                  beforeSend: XRWstext
                })
                .pipe(function() {
                  return Util.wait(100);
                })
                .pipe(self);
              })
              .pipe(function() {
                ol.message('取引終了');
                if (!currentVillage) {
                  return;
                }
                if (market.id == currentVillage.id) {
                  return;
                }
                var href = Util.getVillageChangeUrl(currentVillage.id, '/user/');
                return $.ajax({
                  type: 'get',
                  url: href,
                  beforeSend: XRWstext
                });
              })
              .pipe(function() {
                return Util.wait(1000);
              })
              .done(dfd.resolve).fail(dfd.reject).always(ol.close).always(self.close);
            },
            'キャンセル': function() {
              this.close();
              dfd.reject();
            }
          }
        });
        $html.trigger('metaupdate');
        return dfd;
      },
      //. dialogTraining
      dialogTraining: function() {
        var ol = Display.dialog().message('情報取得中...'),
          current = Util.getVillageCurrent(),
          data = MetaStorage('FACILITY').data,
          pooldata = Util.getPoolSoldiers(),
          facilities = {},
          fcount = 0,
          vcount = 0,
          dialog, $html, $table, $tr, $button;
        '足軽兵舎 弓兵舎 厩舎 兵器鍛冶'.split(' ').forEach(function(key) {
          var facility, flist, slist, tlist, counts;
          flist = Util.getFacility(key);
          if (flist.length === 0) {
            return;
          }
          slist = Util.getValidSoldiers(flist[0]);
          if (slist.length === 0) {
            return;
          }
          slist.sort(function(a, b) {
            return (a.order < b.order);
          });
          facility = {
            list: flist,
            soldiers: slist,
            total: 0,
            count: 0,
            finish: 0
          };
          tlist = pooldata.training.filter(function(elem) {
            return slist.some(function(sol) {
              return sol.type == elem.type;
            });
          });
          tlist.forEach(function(elem) {
            if (!facility[elem.type]) {
              facility[elem.type] = 0;
            }
            facility[elem.type] += elem.num;
            facility.total += elem.num;
            if (elem.finish > facility.finish) {
              facility.finish = elem.finish;
            }
          });
          counts = tlist.length > 0 ? tlist.reduce(function(prev, curr) {
            if (!prev[curr.id]) {
              prev[curr.id] = 0;
            }
            prev[curr.id]++;
            return prev;
          }, {
            0: 0
          }) : {
            0: 0
          };
          facility.count = Math.max.apply(null, $.map(counts, function(value) {
            return value;
          }));
          facilities[key] = facility;
          fcount++;
        });
        
        if (fcount === 0) {
          ol.message('訓練可能な施設は見つかりませんでした。');
          Util.wait(1000).pipe(ol.close);
          return;
        }
        
        $html = $('<div><table class="imc_table" style="width: 100%;" /></div>').attr('id', 'imi_training_dialog');
        $table = $html.find('TABLE');
        $tr = $('<tr><th width="150">施設</th></tr>');
        $.each(facilities, function(key, elem) {
          $tr.append('<th width="150" colspan="3">' + key + '</th>');
        });
        $table.append($tr);
        $tr = $('<tr><td width="150">訓練数 ／ 登録数</td></tr>');
        $.each(facilities, function(key, elem) {
          if (elem.count == 10) {
            $tr.append('<td width="150" colspan="3">' + elem.total + ' ／ <span style="color: #c03;">' + elem.count + '</span></td>');
          } else {
            $tr.append('<td width="150" colspan="3">' + elem.total + ' ／ ' + elem.count + '</td>');
          }
        });
        $table.append($tr);
        
        $tr = $('<tr><td>兵種</td></tr>');
        $.each(facilities, function(key, elem) {
          var html = '' +
            '<td colspan="3">' +
              '<img style="width: 100px; height: 100px;" /><br/>' +
              '<select style="width: 100px;" class="imc_soltype" fname="' + key + '">' +
              elem.soldiers.map(function(soldier) {
                var soldata = Soldier.getByName(soldier.name);
                return '<option value="' + soldata.type + '" src="' + soldier.image + '">' + soldier.name + '</option>';
              }).join('') +
              '</select>' +
            '</td>';
          $tr.append(html);
        });
        $table.append($tr);
        
        $tr = $('<tr><td>入力方法 ／ 分割</td></tr>');
        $.each(facilities, function(key, elem) {
          var html = '' +
          '<td colspan="3">' +
            '<span class="imc_input_type imc_solnum"><span>人数</span>' +
              '<ul class="imc_pulldown">' +
                '<li class="imc_solnum">人数</li>' +
                '<li class="imc_solfinish">時刻</li>' +
                '<li class="imc_soltime">時間</li>' +
                '<li class="imc_solinput">入力</li>' +
              '</ul>' +
            '</span>' +
            '<select style="width: 65px;" class="imc_input" fname="' + key + '"><option value="0">0</option></select>' +
            '<input style="width: 63px; display: none;" class="imc_input_val" fname="' + key + '" />' +
            '／' +
            '<select class="imc_create_count" fname="' + key + '">';
            
          if (elem.count == 10) {
            html += '<option value="0">0</option>';
          }
          for (var i = 1, len = 10 - elem.count; i <= len; i++) {
            html += '<option value="' + i + '">' + i + '</option>';
          }
          
          html += '</select>' +
              '</td>';
              
          $tr.append(html);
        });
        
        $table.append($tr);
        $table.append('<tr><th>施設</th>' + '<th>Lv</th><th>人数</th><th>時間</th>'.repeat(fcount) + '</tr>');
        
        //各拠点
        $.each(data, function(key, elem) {
          var village = Util.getVillageById(key);
          $tr = $('<tr />');
          $tr.append('<td>' + village.name + '</td>');
          $.each(facilities, function(key, elem) {
            var facility = elem.list.filter(function(value) {
              return value.id == village.id;
            });
            if (facility.length === 0) {
              $tr.append('<td colspan="3">-</td>');
            } else {
              facility = facility[0];
              $tr.append('<td width="20" />', $('<td width="45" />').addClass('imc_plan').attr({
                fname: key,
                vid: facility.id
              }), '<td/>');
            }
          });
          $table.append($tr);
          vcount++;
        });
        
        $tr = $('<tr><th>人数計</th></tr>');
        $.each(facilities, function(key, elem) {
          $tr.append('<th></th><td class="imc_total" fname="' + key + '"></td><th></th>');
        });
        $table.append($tr);
        
        $html.append(
        '<br />' +
        '<table class="imc_table imc_result" style="float: left;">' +
          '<tr>' +
            '<th width="100">陣屋</th>' +
            '<td colspan="2">' + pooldata.soldier + ' / ' + pooldata.capacity + '</td>' +
            '<th>訓練可能残</th>' +
            '<td><span class="imc_training_num"></td>' +
          '</tr>' +
          '<tr>' +
            '<td width="100">現在資源</td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_wood.gif' + '"> <span class="imc_resource" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_wool.gif' + '"> <span class="imc_resource" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_ingot.gif' + '"> <span class="imc_resource" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_grain.gif' + '"> <span class="imc_resource" /></td>' +
          '</tr>' +
          '<tr>' +
            '<td width="100">必要資源</td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_wood.gif' + '"> <span class="imc_total_material" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_wool.gif' + '"> <span class="imc_total_material" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_ingot.gif' + '"> <span class="imc_total_material" /></td>' +
            '<td style="text-align: left;"><img src="' + Env.externalFilePath + '/img/common/ico_grain.gif' + '"> <span class="imc_total_material" /></td>' +
          '</tr>' +
        '</table>' +
        '<div id="imi_training_message"></div>' +
        '</div>' +
        '');
        
        $html.on('click', '.imc_input_type LI', function() {
          var $this = $(this),
            type = $this.attr('class'),
            $td = $this.closest('TD'),
            $intype = $td.find('.imc_input_type');
          $intype.removeClass('imc_solnum imc_solfinish imc_soltime imc_solinput').addClass(type);
          $intype.find('SPAN').text($this.text());
          $td.find('.imc_input').attr('disabled', false).trigger('metaupdate');
          if ($this.hasClass('imc_solinput')) {
            $td.find('.imc_input').hide();
            $td.find('.imc_input_val').show();
          } else {
            $td.find('.imc_input').show();
            $td.find('.imc_input_val').hide();
          }
        })
        .on('change', '.imc_soltype', function() {
          var $this = $(this),
            fname = $this.attr('fname'),
            image = $this.find('OPTION:selected').attr('src');
          $this.prevAll('IMG').attr('src', image);
          $html.find('.imc_input[fname="' + fname + '"]').trigger('metaupdate');
        })
        .on('metaupdate', '.imc_input', function() {
          var $this = $(this),
            fname = $this.attr('fname'),
            type = $html.find('.imc_soltype[fname="' + fname + '"]').val(),
            $intype = $this.parent().find('.imc_input_type'),
            resource = Util.getResource(),
            market = Util.getMarket(),
            materials;
          materials = facilities[fname].soldiers.filter(function(elem) {
            return (elem.type == type);
          })[0].materials;
          var rate = (market) ? market.rate : 0,
            freecapa = pooldata.capacity - pooldata.soldier,
            maxnum = Util.getMaxTraining(resource, materials, 0, freecapa, 0),
            overnum = Util.getMaxTraining(resource, materials, rate, freecapa, maxnum),
            flist = facilities[fname].list,
            color, options, soldata, val, step, basetime, starttime, disabled;
          color = '#390';
          options = [];
          soldata = facilities[fname].soldiers.filter(function(elem) {
            return (elem.type == type);
          })[0];
          if ($intype.hasClass('imc_solnum')) {
            //人数
            val = 0;
            step = 100;
            options.push('<option value="0">0</option>');
            (function() {
              var result;
              while (val < overnum) {
                val += step;
                if (val == maxnum) {
                  maxnum = Number.MAX_VALUE;
                }
                if (val > maxnum && maxnum != overnum) {
                  options.push('<option value="' + maxnum + '" style="color: ' + color + '">' + maxnum + '</option>');
                  maxnum = Number.MAX_VALUE;
                }
                if (val > overnum) {
                  val = overnum;
                }
                if (val >= 1000) {
                  step = 500;
                }
                result = Util.checkExchange(resource, Util.getConsumption(materials, val));
                if (result === 0) {
                  break;
                }
                if (result === 1) {
                  color = '#c30';
                }
                options.push('<option value="' + val + '" style="color: ' + color + '">' + val + '</option>');
              }
            })();
          } else if ($intype.hasClass('imc_solfinish')) {
            //時刻
            basetime = facilities[fname].finish;
            basetime = (basetime) ? basetime : Util.getServerTime() + 60;
            starttime = Math.floor(basetime / 900) * 900 + 900;
            options.push('<option value="0">-</option>');
            (function() {
              var i, val, num, result;
              for (i = 0; i <= 1440; i += 15) {
                val = starttime + (i * 60);
                num = Util.divide2(flist, soldata, val - basetime).totalnum;
                result = Util.checkExchange(resource, Util.getConsumption(materials, num));
                if (num === 0) {
                  continue;
                }
                if (num > freecapa) {
                  break;
                }
                if (result === 0) {
                  break;
                }
                if (result === 1) {
                  color = '#c30';
                }
                options.push('<option value="' + (val - basetime) + '" style="color: ' + color + '">' + val.toFormatDate('hh:mi') + '</option>');
              }
            })();
          } else if ($intype.hasClass('imc_soltime')) {
            //時間
            options.push('<option value="0">00h00m</option>');
            (function() {
              var val, num, result;
              for (var i = 15; i <= 1440; i += 15) {
                val = i * 60;
                num = Util.divide2(flist, soldata, val).totalnum;
                result = Util.checkExchange(resource, Util.getConsumption(materials, num));
                if (num === 0) {
                  continue;
                }
                if (num > freecapa) {
                  break;
                }
                if (result === 0) {
                  break;
                }
                if (result === 1) {
                  color = '#c30';
                }
                options.push('<option value="' + val + '" style="color: ' + color + '">' + val.toFormatTime('hhhmim') + '</option>');
              }
            })();
          }
          $this.empty().append(options.join(''));
          //手入力の場合options.length == 0になる
          if (options.length === 0) {
            disabled = (overnum === 0 || facilities[fname].count == 10);
            $html.find('.imc_input_val').filter('[fname="' + fname + '"]').val(0).trigger('change').attr('disabled', disabled);
          } else {
            disabled = (options.length == 1 || facilities[fname].count == 10);
            $html.find('.imc_input').filter('[fname="' + fname + '"]').trigger('change').attr('disabled', disabled);
          }
          $html.find('.imc_create_count').filter('[fname="' + fname + '"]').attr('disabled', disabled);
        })
        .on('change', '.imc_input', function() {
          var $this = $(this);
          $this.parent().find('.imc_input_val').val($this.val()).trigger('change');
        })
        .on('change', '.imc_input_val', function() {
          var $this = $(this),
            num = $this.val().toInt(),
            fname = $this.attr('fname'),
            type = $html.find('.imc_soltype[fname="' + fname + '"]').val(),
            count = $html.find('.imc_create_count[fname="' + fname + '"]').val(),
            $intype = $this.parent().find('.imc_input_type'),
            uranai = Util.getUranai(),
            soldata, list, total;
          if (isNaN(num)) {
            num = 0;
            $this.val(0);
          } else {
            $this.val(num);
          }
          soldata = facilities[fname].soldiers.filter(function(elem) {
            return (elem.type == type);
          })[0];
          if ($intype.is('.imc_solnum, .imc_solinput')) {
            list = Util.divide(facilities[fname].list, soldata, num);
          } else {
            list = Util.divide2(facilities[fname].list, soldata, num);
          }
          total = 0;
          list.forEach(function(elem) {
            elem.create_count = count;
            total += elem.solnum;
            $html.find('TD[fname="' + fname + '"][vid="' + elem.id + '"]').data('plan', elem).trigger('metaupdate');
          });
          $html.find('TD.imc_total[fname="' + fname + '"]').text(total);
          $this.parent().removeAttr('style');
          if (num > 0) {
            $this.parent().css('background-color', '#77692F');
          }
          $html.find('.imc_result').trigger('metaupdate');
        })
        .on('change', '.imc_create_count', function() {
          $(this).parent().find('.imc_input_val').trigger('change');
        })
        .on('metaupdate', '.imc_plan', function() {
          var $this = $(this),
            plan = $(this).data('plan');
          $this.prev().text(plan.lv);
          $this.text(plan.solnum);
          $this.next().text(plan.trainingtime.toFormatTime());
        })
        .on('metaupdate', '.imc_result', function() {
          var $this = $(this),
            execute = true,
            resource, materials, solnum, trainingnum, check;
          resource = Util.getResource();
          materials = $html.find('.imc_plan').map(function() {
            return [($(this).data('plan') || {
              materials: [0, 0, 0, 0]
            }).materials];
          }).get().reduce(function(prev, curr) {
            for (var i = 0, len = prev.length; i < len; i++) {
              prev[i] += curr[i];
            }
            return prev;
          }, [0, 0, 0, 0]);
          solnum = $html.find('.imc_plan').map(function() {
            return [($(this).data('plan') || {
              solnum: 0
            }).solnum];
          }).get().reduce(function(prev, curr) {
            return prev + curr;
          }, 0);
          trainingnum = pooldata.capacity - solnum - pooldata.soldier;
          $this.find('.imc_training_num').text(trainingnum);
          if (trainingnum < 0) {
            $this.find('.imc_training_num').parent().css({
              backgroundColor: 'firebrick'
            });
          } else {
            $this.find('.imc_training_num').parent().css({
              backgroundColor: '#77692F'
            });
          }
          //資源
          $this.find('.imc_resource').each(function(idx) {
            $(this).text(resource[idx]);
          });
          $this.find('.imc_total_material').each(function(idx) {
            var $this = $(this);
            $this.text(materials[idx]).removeClass('imc_surplus imc_shortage');
            if (materials[idx] > resource[idx]) {
              $this.addClass('imc_shortage');
            } else {
              $this.addClass('imc_surplus');
            }
          });
          check = Util.checkExchange(resource, materials);
          if (solnum === 0) {
            execute = false;
            $('#imi_training_message').text('');
          } else if (trainingnum < 0) {
            $('#imi_training_message').text('陣屋の容量を超えています');
            execute = false;
          } else if (check === 0) {
            $('#imi_training_message').text('資源が不足しています');
            execute = false;
          } else if (check === 1) {
            $('#imi_training_message').text('取引可能です');
            $button.text('取引後に訓練開始');
          } else {
            $('#imi_training_message').text('取引の必要はありません');
            $button.text('訓練開始');
          }
          $button.attr('disabled', !execute);
        });
        
        dialog = Display.dialog({
          title: '一括兵士訓練',
          width: 935,
          height: 505,
          top: 50,
          content: $html,
          buttons: {
            '訓練開始': function() {
              var self = this,
                ol, total, plans, workid;
              total = $html.find('.imc_total_material').map(function() {
                return $(this).text().toInt();
              }).get();
              $.Deferred().resolve().pipe(function() {
                var resource = Util.getResource();
                result = Util.checkExchange(resource, total);
                if (result === 0) {
                  return $.Deferred().reject();
                } else if (result == 1) {
                  return Display.dialogExchange(resource, total);
                } else {
                  if (!window.confirm('訓練を開始してよろしいですか？')) {
                    return $.Deferred().reject();
                  }
                }
              })
              .pipe(function() {
                ol = Display.dialog();
                ol.message('一括訓練登録処理開始...');
                plans = $html.find('.imc_plan').map(function() {
                  var plan = $(this).data('plan');
                  return (plan.solnum > 0) ? plan : null;
                }).get();
              })
              .pipe(function() {
                var plan = plans.shift();
                if (!plan) {
                  return;
                }
                return $.Deferred().resolve().pipe(function() {
                  if (workid == plan.id) {
                    return;
                  }
                  workid = plan.id;
                  var href = Util.getVillageChangeUrl(plan.id, '/user/');
                  return $.ajax({
                    type: 'get',
                    url: href,
                    beforeSend: XRWstext
                  });
                })
                .pipe(function() {
                  var href = '/facility/facility.php?x=' + plan.x + '&y=' + plan.y,
                    data = {
                      unit_id: plan.type,
                      x: plan.x,
                      y: plan.y,
                      count: plan.solnum,
                      create_count: plan.create_count,
                      btnSend: true
                    };
                  var village = Util.getVillageById(plan.id);
                  var soldata = Soldier.getByType(plan.type);
                  ol.message('「' + village.name + '」にて【' + soldata.name + '】を登録中...');
                  return $.ajax({
                    type: 'post',
                    url: href,
                    data: data,
                    beforeSend: XRWstext
                  });
                })
                .pipe(arguments.callee);
              })
              .pipe(function() {
                ol.message('一括訓練処理終了').message('ページを更新します...');
                var href = Util.getVillageChangeUrl(current.id, '/facility/unit_list.php');
                Page.move(href);
              });
            },
            '閉じる': function() {
              this.close();
            }
          }
        });
        
        $button = dialog.buttons.eq(0).attr('disabled', true);
        $html.find('.imc_soltype').trigger('change');
        var href = Util.getVillageChangeUrl(current.id, '/user/');
        $.ajax({
          type: 'get',
          url: href,
          beforeSend: XRWstext
        })
        .pipe(ol.close);
      }
    });
    // Display }

    //■ Page {
    var Page = function() {
      var path = arguments[0],
        key = '/' + path.join('/'),
        actionList = Page.actionList,
        extentionList = Page.extentionList,
        action;
      if (Env.loginState == -1) {
        return new Page.noaction();
      } else if (Env.loginState === 0) {
        return new Page.noaction();
      } else {
        action = new Page.pageaction();
      }
      if (actionList[key]) {
        $.extend(action, actionList[key]);
      }
      if (extentionList[key]) {
        action.callbacks = extentionList[key];
      }
      return action;
    };

    //. Page
    $.extend(Page, {
      //.. actionList
      actionList: {},
      //.. extentionList
      extentionList: {},
      //.. registerAction
      registerAction: function() {
        var args = Array.prototype.slice.call(arguments),
          obj = args.pop(),
          key = '/' + args.join('/'),
          list = this.actionList;
        if (list[key]) {
          $.extend(list[key], obj);
        } else {
          list[key] = obj;
        }
      },
      //.. move
      move: function(url) {
        window.setTimeout(function() {
          location.href = url;
        }, 1000);
      },
      //.. action
      action: function() {},
      //.. pageaction
      pageaction: function() {},
      //.. noaction
      noaction: function() {}
    });

    //. Page.noaction.prototype
    $.extend(Page.noaction.prototype, {
      //.. execute
      execute: function() {}
    });

    //. Page.pageaction.prototype
    $.extend(Page.pageaction.prototype, {
      //.. execute
      execute: function() {
        this.main();
        if (this.callbacks) {
          this.callbacks.fire();
        }
      },
      //.. main
      main: function() {}
    });

    //■ /village
    Page.registerAction('village', {
      //. main
      main: function() {
        this.getFacilityList();
      },
      //. getFacilityList
      getFacilityList: function() {
        var storage = MetaStorage('FACILITY'),
          basename = $('#basepointTop .basename').text(),
          village = Util.getVillageByName(basename),
          data, list = {};
        $('#mapOverlayMap').find('AREA[alt^="市"]').each(addList).end()
          .find('AREA[alt^="足軽兵舎"]').each(addList).end()
          .find('AREA[alt^="弓兵舎"]').each(addList).end()
          .find('AREA[alt^="厩舎"]').each(addList).end()
          .find('AREA[alt^="兵器鍛冶"]').each(addList).end();
        storage.begin();
        data = storage.data;
        data[village.id] = list;
        //表示拠点選択にある拠点だけで登録
        var baselist = BaseList.home(),
          newdata = {};
        $.each(baselist, function() {
          if (data[this.id] !== undefined) {
            newdata[this.id] = data[this.id];
          }
        });
        storage.data = newdata;
        storage.commit();
        
        function addList() {
          var $this = $(this),
            alt = $this.attr('alt'),
            href = $this.attr('href'),
            array, name, lv, x, y;
          array = alt.match(/(.+) LV.(\d+)/);
          if (!array) {
            return;
          }
          alt = array[0];
          name = array[1];
          lv = array[2];
          array = href.match(/x=(\d+)&y=(\d+)/);
          href = array[0];
          x = array[1];
          y = array[2];
          list[name] = {
            x: x.toInt(),
            y: y.toInt(),
            lv: lv.toInt()
          };
        }
      }
    });
    
    //■ 実行
    Page(Env.path).execute();
    // Page }
    
    // 一括兵士訓練のリンク埋め込み
    (function() {
      $('<div><li><a href="javascript:void(0);">【一括兵士訓練】</a></li></div>')
        .css('font-color', 'white').on('click', 'a', Display.dialogTraining)
        .prependTo('li.gMenu01 > ul');
    })();
  }

  // load
  window.addEventListener('DOMContentLoaded', function() {
    
    if (location.pathname == '/top' || location.pathname == '/banner/') {
      return;
    }
    
    var style = document.createElement('style');
    style.setAttribute('type','text/css');
    style.innerHTML = '' +
      /* テーブルスタイル */
      '.imc_table { border-collapse: collapse; border: solid 1px dimGray; color: white; }' +
      '.imc_table TH { padding: 4px 6px; text-align: center; vertical-align: middle; border-bottom: dotted 1px dimGray; border-left: solid 1px dimGray; background:  linear-gradient(to bottom, #949494 0%,#797979 100%); text-shadow: black 1px 1px 3px, black -1px -1px 3px; }' +
      '.imc_table TD { padding: 4px 5px; text-align: center; vertical-align: middle; border-bottom: solid 1px dimGray; border-left: solid 1px dimGray; background-color: black; }' +
      '.imc_table.td_right TD { text-align: right; }' +
      '.imc_table TD img { vertical-align: text-top; }' +
      '.imc_table TH.h100 { background-size: 100% 100%; }' +
      '#imi_ex_type .imc_selected { background-color: #77692f; }' +
      /* overlay用 z-index: 2000 */
      '#imi_overlay { position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; z-index: 2000; }' +
      '#imi_overlay .imc_overlay { position: absolute; width: 100%; height: 100%; background-color: #000; opacity: 0.75; }' +
      /* ダイアログメッセージ用 */
      '#imi_dialog_container { position: relative; margin: auto; width: 500px; height: auto; background-color: rgba(0, 0, 0, 0.6); color: white; border: 4px solid #77692f; overflow: hidden; }' +
      '#imi_dialog_container .imc_dialog_header { padding: 8px; color: white; }' +
      '#imi_dialog_container .imc_dialog_body { margin: 8px 0px 8px 8px; padding-right: 8px; font-size: 12px; height: 200px; overflow: auto; }' +
      '#imi_dialog_container .imc_dialog_footer { margin: 5px; padding: 5px 10px; border-top: solid 1px dimgray; text-align: right; }' +
      '#imi_dialog_container .imc_message { margin: 4px; }' +
      '#imi_dialog_container BUTTON { margin-left: 8px; padding: 5px; min-width: 60px; border: solid 1px dimgray; border-radius: 3px; cursor: pointer; color: #000; background: -moz-linear-gradient(top, #fff, #ccc); background: -webkit-gradient(linear, left top, left bottom, from(#fff), to(#ccc)); }' +
      '#imi_dialog_container BUTTON:hover { background: -moz-linear-gradient(bottom, #fff, #ccc); background: -webkit-gradient(linear, left bottom, left top, from(#fff), to(#ccc)); }' +
      '#imi_dialog_container BUTTON:active { border-style: inset; }' +
      '#imi_dialog_container BUTTON:disabled { color: #666; border-style: solid; background: none; background-color: #ccc; cursor: default; }' +
      /* 一括兵士訓練ダイアログ用 */
      '#imi_training_dialog .imc_surplus { color: limegreen; }' +
      '#imi_training_message { width: 350px; float: left; text-align: center; padding: 10px; font-size: 14px; color: red; }' +
      '#imi_training_dialog .imc_input_type { position: relative; display: inline-block; margin-right: 2px; padding: 2px 3px; cursor: pointer; -moz-user-select: none; background-color: #505050; color: white; border-radius: 3px; }' +
      '#imi_training_dialog .imc_input_type .imc_pulldown { position: absolute; margin-left: -4px; z-index: 2000; text-align: left; display: none; }' +
      '#imi_training_dialog .imc_input_type:hover .imc_pulldown { display: block; background-color: black; border: solid 1px white; }' +
      '#imi_training_dialog .imc_input_type .imc_pulldown LI { width: 30px; height: 20px; text-align: center; line-height: 20px; }' +
      '#imi_training_dialog .imc_input_type .imc_pulldown LI:hover { background-color: dimGray; }' +
      '#imi_training_dialog .imc_input_val { ime-mode: disabled; }' +
      
      '';
    document.head.appendChild(style);
    
    var scriptMeta = document.createElement('script');
      scriptMeta.setAttribute('type','text/javascript');
      scriptMeta.textContent = '(' + meta.toString() + ')(j213$);';
    document.head.appendChild(scriptMeta);
  });
  
})();
