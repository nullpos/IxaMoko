(function(){
    function main($) {
        if (location.pathname != '/senkuji/senkuji.php') {
            return
        }
        const WHITE_PRICE = 200
        const STORAGE_KEY = "ixa_auto_white"
        let timerId = -1
        let storage = localStorage.getItem(STORAGE_KEY)

        let state = {
            'senkuji_token': null,
            'money': 0,
            'card': 0,
            'card_cap': 0,
            'bids': 0,
            'statistics': [0, 0, 0, 0],
            'percentage': [0, 0, 0],
            white: function(result) {
                state['card']++
                state['money'] -= WHITE_PRICE
                state['statistics'][0]++
                state['statistics'][result['rare']-2]++
                for(let i = 0; i < state['percentage'].length; i++) {
                    if(state['statistics'][0] != 0) {
                        state['percentage'][i] = parseInt(1000 * (state['statistics'][i+1] / state['statistics'][0])) / 10
                    }
                }
            },
            remove: function() {
                state['card']--
                state['money'] += 30
            }
        }

        var xrwStatusText = function(xhr) {
            return xhr.setRequestHeader('X-Requested-With', 'statusText');
        };

        let tmp = JSON.parse(storage)
        if(tmp) {
            storage = tmp
        } else {
            storage = {
                'while': 'while_card',
                'while_num': '10',
                'after': 'after_keep',
                'keep_rare': 'toku',
                'keep_skills': '槍隊堅守,槍隊進撃'
            }
        }
    
        // create interface
        
        /// Dog text
        let text = $('<a id="auto_white_dog" href="#" style="color: black;">自動で白くじを引くワン？</a>')

        /// Configure
        let parentDiv = $('<div class="ig_tilesection_innermid"></div>')

        let loopDiv = $('<div style="display: inline-block; vertical-align: top; margin: 8px;"></div>')
        let loopInfo = $('<p><strong>条件</strong></p>')
        let loop1 = createRadio('while_card', 'while', '指定した枚数')
        let loop2 = createRadio('while_under', 'while', '指定した所持銅銭以下になるまで')
        let loop3 = createRadio('while_consume', 'while', '指定した銅銭を消費')
        let loopText = createTextInput('loopText', '指定数')
        loopDiv.append(loopInfo).append(loop1).append(loop2).append(loop3).append(loopText)
        loopDiv.find('input[name=while]').val([storage['while']])
        loopText.find('input').val(storage['while_num'])

        let afterDiv = $('<div style="display: inline-block; vertical-align: top; margin: 8px;"></div>')
        let afterInfo = $('<p><strong>後処理</strong></p>')
        let after1 = createRadio('after_remove', 'after', '破棄')
        let after2 = createRadio('after_keep', 'after', 'すべて保持')
        afterDiv.append(afterInfo).append(after1).append(after2)
        afterDiv.find('input[name=after]').val([storage['after']])

        let keepDiv = $('<div style="display: inline-block; vertical-align: top; margin: 8px;"></div>')
        let keepInfo = $('<p><strong>保持する武将(破棄の場合のみ、いずれかに合致)</strong></p>')
        let keepRarity = createRaritySelect()
        let keepSkill = createTextInput('keepText', 'スキル名(カンマ区切り)')
        let keepSkillList = $('<p></p>')
        keepDiv.append(keepInfo).append(keepRarity).append(keepSkill).append(keepSkillList)
        keepRarity.find('select').val(storage['keep_rare'])
        keepSkill.find('input:first').val(storage['keep_skills'])
        showSkillList()

        let startDiv = $('<div style="text-align: right;"></div>')
        let startButton = $('<input type="button" value="開始" />')
        startDiv.append(startButton)

        let displayDiv = $('<div></div>')
        let logs = $('<p style="overflow-y: scroll; height: 400px; width: 100%; display: none;"></p>')
        

        parentDiv.append(loopDiv).append(afterDiv).append(keepDiv).append(startDiv).append(displayDiv).append(logs)
        let div = $('<div class="ig_tilesection_mid" style="display: none;">&nbsp;</div>').append(
            $('<div class="ig_tilesection_innertop"></div>')).append(parentDiv).append(
            $('<div class="ig_tilesection_innerbottom">&nbsp;</div>'))
        $('.lotmacine_head:first').after(div)
        $('#ixaDogTop p').empty().append(text)


        // event
        text.on('click', function(e) {
            div.toggle(400)
        })

        $('#keepText').on('change', showSkillList)

        startButton.on('click', function() {
            if(timerId == -1) {
                if(isValid()) {
                    save()
                    startButton.val('中断')
                    init()
                    start()
                } else {
                    alert("入力を確認してください。")
                }
            } else {
                clearTimeout(timerId)
                timerId = -1
                startButton.val('決定')
            }
        })

        // factory method
        function showSkillList() {
            let text = keepSkill.find('input:first').val()
            keepSkillList.html(text.split(',').join('</br>'))
        }
        
        function createRadio(id, name, text) {
            let radio = $('<input type="radio" name="' + name + '" id="' + id + '" value="' + id + '"/>')
            let label = $('<label for="' + id + '">' + text + '</label>')
            let div = $('<div style="margin: 8px;"></div>').append(radio).append(label)
            return div
        }

        function createTextInput(id, text) {
            let input = $('<input type="text" id="' + id + '"/>')
            let label = $('<label for="' + id + '">' + text + ': </label>')
            let div = $('<div style="margin: 8px;"></div>').append(label).append(input)
            return div
        }

        function createRaritySelect() {
            let div = $('<div style="margin: 8px;"></div>')
            let label = $('<label for="rarity">レアリティ以上: </label>')
            let select = $('<select id="rarity" name="rarity"></select>')
            let options = $('<option value="toku" selected>特</option><option value="jou">上</option><option value="jo">序</option>')
            return div.append(label).append(select.append(options))
        }

        // util
        function isValid() {
            let cond = $('input[name=while]:checked').val()
            let num = $('#loopText').val()
            let after = $('input[name=after]:checked').val()
            if(!cond) {
                //undefined
                return false
            }
            if(!after) {
                //undefined
                return false
            }
            if(!parseInt(num) && parseInt(num) != 0) {
                return false
            }
            return true
        }

        function rareToNum(text) {
            if(text == 'toku') {
                return 3
            } else if(text == 'jou') {
                return 4
            } else if(text == 'jo') {
                return 5
            } else {
                return 0
            }
        }

        function save() {
            storage['while'] = $('input[name=while]:checked').val()
            storage['while_num'] = $('#loopText').val()
            storage['after'] = $('input[name=after]:checked').val()
            storage['keep_rare'] = $('#rarity').val()
            let skills = $('#keepText').val()
            if(skills.strip() != '') {
                storage['keep_skills'] = skills
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
        }


        let condition = (function() {
            let func = null
            return {
                continue: function() {
                    return func()
                },
                init: function() {
                    let val = $('input[name=while]:checked').val()
                    let num = $('#loopText').val() * 1
                    if(val == 'while_card') {
                        func = (function(num) {
                            let n = num
                            let counter = 0
                            return function() {
                                if(counter++ >= n) {
                                    return false
                                }
                                return true
                            }
                        })(num)
                    } else if(val == 'while_under') {
                        func = (function(num) {
                            let n = num
                            return function() {
                                if(state['money'] <= n) {
                                    return false
                                }
                                return true
                            }
                        })(num)
                    } else if(val == 'while_consume') {
                        func = (function(num) {
                            let n = num
                            let initN = state['money']
                            return function() {
                                if(initN - state['money'] >= n) {
                                    return false
                                }
                                return true
                            }
                        })(num)
                    }
                }
            }
        })()

        let after = (function() {
            let func = null
            return {
                init: function() {
                    let val = $('input[name=after]:checked').val()
                    if(val == 'after_keep') {
                        func = function() { return false }
                    } else if(val == 'after_remove') {
                        let rare = rareToNum($('#rarity').val())
                        let skills = $('#keepText').val().split(',')
                        func = (function(r, s) {
                            let rare = r
                            let skills = s
                            return function(data) {
                                let shouldRemove = (data['rare'] > r) && (skills.indexOf(data['skill']) == -1)
                                return shouldRemove
                            }
                        })(rare, skills)
                    }
                },
                shouldRemove: function(data) {
                    return func(data)
                }
            }
        })()
        
        let log = (function() {
            return {
                shortage: function() {
                    logs.html('銅銭が足りないため、終了しました。</br>' + logs.html())
                },
                capOver: function() {
                    logs.html('カード所持上限に達したため、終了しました。</br>' + logs.html())
                },
                success: function() {
                    logs.html('条件を満たしたため、終了しました。</br>' + logs.html())
                },
                card: function(data, removed) {
                    let rare = ''
                    if(data['rare'] <= 3) {
                        rare = '<strong>特</strong>'
                    } else if(data['rare'] <= 4) {
                        rare = '上'
                    } else if(data['rare'] <= 5) {
                        rare = '序'
                    }
                    let text = ''

                    if(removed) {
                        text = rare + ' No.' + data['no'] + ': ' + data['name'] + '(' + data['skill'] + ') ...破棄</br>'
                    } else {
                        text = rare + ' No.' + data['no'] + ': <strong>' + data['name'] + '</strong>(' + data['skill'] + ') ...保持</br>'
                    }
                    logs.html(text + logs.html())
                }
            }
        })()

        let display = (function() {
            let money = $('<p>所持銅銭: ' + state['money'] + '</p>')
            let cards = $('<p>所持カード: ' + state['card'] + '</p>')
            let bids = $('<p>入札中: ' + state['bids'] + '</p>')
            let card_cap = $('<p>カード上限: ' + state['card_cap'] + '</p>')
            let statistics = $('<p></p>')

            let html_card = $('.l_cardstock')
            let html_money = $('.money_b')
            return {
                update: function() {
                    money.text('所持銅銭: ' + state['money'])
                    cards.text('所持カード: ' + state['card'])
                    bids.text('入札中: ' + state['bids'])
                    card_cap.text('カード上限: ' + state['card_cap'])
                    let text1 = '全体: ' + state['statistics'][0] + ', 特: ' + state['statistics'][1] + ', 上: ' + state['statistics'][2] + ', 序: ' + state['statistics'][3]
                    let text2 = '(' + state['percentage'][0] + '%, ' + state['percentage'][1] + '%, ' + state['percentage'][2] + '%)'
                    statistics.text(text1 + ' ' + text2)

                    html_card.text(state['card'] + ' / ' + state['card_cap'])
                    html_money.text(state['money'])
                },
                init: function() {
                    displayDiv.empty().append(money).append(cards).append(bids).append(card_cap).append(statistics).append('</br>')
                }
            }
        })()


        function init() {
            state['money'] = $('.money_b:first').text() * 1
            state['card'] = $('.l_cardstock').text().split('/')[0].strip() * 1
            state['card_cap'] = $('.l_cardstock').text().split('/')[1].strip() * 1
            state['bids'] = getBids()
            state['senkuji_token'] = $('input[name="senkuji_token"]').val()
            logs.show()
            display.init()
            display.update()
            condition.init()
            after.init()
        }

        function start() {
            if(!condition.continue()) {
                log.success()
                timerId = -1
                startButton.val('決定')
                return
            }
            if(state['money'] < WHITE_PRICE) {
                log.shortage()
                timerId = -1
                startButton.val('決定')
                return
            }
            if(state['card'] + state['bids'] >= state['card_cap']) {
                log.capOver()
                timerId = -1
                startButton.val('決定')
                return
            }

            let result = white()
            state.white(result)
            display.update()

            if(after.shouldRemove(result)) {
                remove(result['id'])
                log.card(result, true)
                state.remove()
            } else {
                log.card(result, false)
            }
            display.update()
            timerId = setTimeout(start, 500)
        }

        // ajax
        function getBids() {
            let html = $.ajax({
                type: 'get',
                url: '/card/bid_list.php',
                beforeSend: xrwStatusText,
                async: false
            }).responseText
            return $(html).find('.t_cardstock.rightF:first').text().split('：')[2].split('件')[0] * 1
        }

        function white() {
            let data = {
                send: 'send',
                got_type: '0',
                sub_id: '0',
                senkuji_token: state['senkuji_token']
            }
            let html = $.ajax({
                type: 'post',
                url: '/senkuji/senkuji.php',
                data: data,
                beforeSend: xrwStatusText,
                async: false
            }).responseText
            
            let $card_front = $(html).find('#id_deck_card_front'),
                card_name = $card_front.find('span.ig_card_name').text(),
                rare = $card_front.find('span[class^="rarity_"]').attr('class').split('_')[1],
                card_id = $card_front.find('.commandsol_').attr('id').split('_')[2],
                card_no = $card_front.find('.ig_card_cardno').text(),
                skill = $(html).find('#id_deck_card_back').find('.ig_skill_name').text().split('L')[0]
            return {
                'name': card_name,
                'rare': rareToNum(rare),
                'id': card_id,
                'no': card_no,
                'skill': skill
            }
        }

        function remove(card_num) {
            let data = {
                show_num: 100,
                p: 4,
                tmp_show_num: 100,
                select_card_group: 0,
                select_filter_num: 0,
                'delete_card_arr[]': card_num,
                btn_send: '破棄を実行'
            }
            let html = $.ajax({
                type: 'post',
                url: '/card/deck_card_delete.php',
                data: data,
                beforeSend: xrwStatusText,
                async: false
            }).responseText
        }
    }

    window.addEventListener('DOMContentLoaded', function() {
        var scriptMeta = document.createElement('script')
        scriptMeta.setAttribute('type','text/javascript')
        scriptMeta.textContent = '(' + main.toString() + ')(j213$);'
        document.head.appendChild(scriptMeta)
    });
})();