/**
            * 作者：Rtian
            * 版本：1.0.0
            * 日期：2025-06-06
            * 功能：日历类
            * 显示公共节假日
            * 设置自定义节假日：如值班日期
            * 自定义点击事件： done(datestr){}
            * 自定义默认日期
            * 使用方法：默认显示当前月份,可以设置 options.date显示指定日期月份
            * let calender = new rtianCalendar('#calendar');
            * calender.render();
            * 或：
            * let calender = new rtianCalendar();
            * calender.render('#calendar');
            * 或
            * let calender = new rtianCalendar();
            * calender.render({
            *      elem: '#calendar',
            *      showPbulicHoliday: true,
            *      done: function(dt){
            *          console.log(dt)
            *      }
            * });
            */
(function (window, document) {
    "use strict";
    function JD(y, m, d) { //公历转儒略日
        var n = 0,
            G = 0;
        if (y * 372 + m * 31 + Math.floor(d) >= 588829) G = 1; //判断是否为格里高利历日1582*372+10*31+15
        if (m <= 2) m += 12, y--;
        if (G) n = Math.floor(y / 100), n = 2 - n + Math.floor(n / 4); //加百年闰
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.601 * (m + 1)) + d + n - 1524.5;
    }

    function JD2GL(jd) {
        let D = ~~(jd + 0.5);
        if (D >= 2299161) {
            let c = ~~((D - 1867216.25) / 36524.25);
            D = D + 1 + c - ~~(c / 4);
        }
        D += 1524;
        let Y = ~~((D - 122.1) / 365.25);
        D -= ~~(Y * 365.25);
        let M = ~~(D / 30.601);
        D -= ~~(M * 30.601);
        if (M > 13) M -= 13, Y -= 4715;
        else M -= 1, Y -= 4716;
        return [Y, M, D];
    }
    function getWeek(jd) {
        return Math.floor(jd + 1.5 + 7000000) % 7;
    }
    class rtianCalendar {
        constructor(selector) {
            this.elem = selector;
            this.dom = document.querySelector(selector);
            this.weekstart = 1;
            this.weekstr = ['日', '一', '二', '三', '四', '五', '六', '日'];
        }
        theme = "block";
        width = 300;
        height = 350;
        rowHeight = 0;
        fontSize = 14;
        showToday = true;
        showPublicHoliday = false;
        holiday = [];
        today = new Date().toISOString().slice(0, 10);
        date = this.today;
        showLunar = false;
        publicHoliday = {
            '01-01': '元旦',
            '05-01': '劳动节',
            '10-01': '国庆节',
        };

        init() {
            let dom = this.dom;
            var wkstr = this.weekstr.slice(this.weekstart);
            let th = '';
            for (let i = 0; i < 7; i++) {
                th += `<th class="week"><div>${wkstr[i]}</div></th>`;
            }
            th = `<tr class="th">${th}</tr>`;
            let day = 1;
            let tr = '';
            for (let i = 0; i < 6; i++) {//行
                let row = '';
                for (let j = 0; j < 7; j++) {//列
                    row += `<td class="day"><div></div></td>`;
                }
                tr += `<tr>${row}</tr>`;
                if (day > this.totalDay) {
                    break;
                }
            }
            let caption = '<caption><div class="yearmonth"><div title="上一月" class="prev-month"><</div><div title="返回今日" class="month-year"></div><div title="下一月" class="next-month">></div></div></caption>';
            let table = `<table>${caption}<thead>${th}</thead><tbody>${tr}</tbody></table>`;
            let html = `<div id="rtian-calendar" theme="${this.theme}">${table}</div>`;
            dom.innerHTML = html;
            let div = dom.querySelector('#rtian-calendar');
            dom.style.width = this.width + 'px';
            dom.style.fontSize = this.fontSize + 'px';
            dom.style.height = (this.height) + 'px';
            this.days = dom.querySelectorAll('.day');
            this.addClickEvent();
        };

        //添加日期的点击事件
        addClickEvent() {
            //日期点击事件
            let days = this.days;
            for (let i = 0; i < days.length; i++) {
                let dom = days[i];
                dom.addEventListener('click', (e) => {
                    if (!dom.matches('.cday')) return;
                    let dt = dom.getAttribute('date');
                    this.date = dt;
                    let active = this.dom.querySelector('.active');
                    if (active) {
                        active.classList.remove('active');
                    }
                    dom.classList.add('active');
                    //选中日期时，将日期绑定到done
                    this.done(dt);
                });
            }
            //月份点击事件，返回今日
            let monthYear = this.dom.querySelector('.month-year');
            // monthYear.addEventListener('click', (e) => {
            //     if (this.date == this.today) return;
            //     //点击返回今日
            //     this.date = this.today;
            //     let [y, m, d] = this.today.split('-').map(n => n * 1);
            //     this.load(y, m);
            //     this.change(this.today);
            // });
            //上一个月点击事件
            let prevMonth = this.dom.querySelector('.prev-month');
            prevMonth.addEventListener('click', (e) => {
                // let y = this.year;
                // let m = this.month;
                // let d = this.day;
                let [y, m, d] = this.date.split('-').map(n => n * 1);
                if (m == 1) {
                    y--;
                    m = 12;
                } else {
                    m--;
                }
                if (y == 1582 && m == 10 && (d > 4 && d < 15)) d = 15;
                let datestr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                this.date = datestr;
                this.load(y, m);
                this.change(datestr);
            });
            //下一个月点击事件
            let nextMonth = this.dom.querySelector('.next-month');
            nextMonth.addEventListener('click', (e) => {
                let [y, m, d] = this.date.split('-').map(n => n * 1);
                if (m == 12) {
                    y++;
                    m = 1;
                } else {
                    m++;
                }
                if (y == 1582 && m == 10 && (d > 4 && d < 15)) d = 15;
                let datestr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                this.date = datestr;
                this.load(y, m);
                this.change(datestr);
            });
        };
        //选中日期事件
        done(dt) {
            console.log(dt);
        }
        //切换月份事件
        change(dt) {
            console.log('change', dt);
        }
        selectDay(dt) {

        }

        renderMaker(holidays) {
            if (!holidays) return;
            if (typeof holidays == 'string') {
                holidays = holidays.indexOf(',') < 0 ? [holidays] : holidays.split(',');
            }
            let days = this.days;
            this.holiday = holidays || this.holiday;
            for (let i = 0; i < days.length; i++) {
                let div = days[i];
                let datestr = div.getAttribute('date');
                if (this.holiday.includes(datestr)) {//设置自定义节假日
                    div.classList.add('holiday');
                }
            }
        }

        //渲染方法
        render(options) {
            if (typeof options == 'string') {
                this.elem = options;
            }
            if (typeof options == "object") {
                ('elem' in options) && (this.elem = options.elem);
                ('done' in options) && (this.done = options.done);
                ('change' in options) && (this.change = options.change);
                ('date' in options) && (this.date = options.date);
                ('holidays' in options) && (this.holiday = options.holidays);
                ('weekstart' in options) && (this.weekstart = options.weekstart);
                ('showPublicHoliday' in options) && (this.showPublicHoliday = options.showPublicHoliday);
                ('width' in options) && (this.width = options.width);
                ('height' in options) && (this.height = options.height);
                ('theme' in options) && (this.theme = options.theme);
                ('fontSize' in options) && (this.fontSize = options.fontSize);
                ('showToday' in options) && (this.showToday = options.showToday);
                ('showLunar' in options) && (this.showLunar = options.showLunar);
                ('renderLunar' in options) && (this.renderLunar = options.renderLunar);
            }
            this.dom = document.querySelector(this.elem) || this.dom;
            if (!this.dom) {
                console.error('未设置日历容器ID');
                return;
            }
            this.height = this.dom.offsetHeight;
            if (this.height < 280) this.showPublicHoliday = false;
            this.init();
            //设置固定行高
            let rows = this.dom.querySelectorAll('tbody>tr');
            //设置行高
            this.rowHeight = rows[0].offsetHeight;
            for (let row of rows) {
                row.style.height = this.rowHeight + 'px';
            }
            let [y, m, d] = this.date.split('-').map(n => n * 1);
            this.day = d;
            this.date = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            this.load(y, m);
            return this;
        }
        load(year, month) {
            this.year = year;
            this.month = month;
            document.querySelector('.month-year').innerHTML = `<input type="text" value="${year}"/>年<span class="month">${month}</span>月`;
            let y = year, m = month, weekstart = this.weekstart;
            let jd = JD(y, m, 1);
            let wk = getWeek(jd);
            let startDay = (wk + 7 - weekstart) % 7;
            let days = this.days;
            let day = jd - startDay;
            let idx = 0;
            for (let i = 0; i < 42; i++) {
                let div = days[i];
                div.className = 'day';
                let [_y, _m, _d] = JD2GL(day + i);
                if (_m == m) {
                    div.classList.add('cday');
                    idx++;
                }
                div.innerHTML = `${_d}`;
                let datestr = `${_y}-${_m.toString().padStart(2, '0')}-${_d.toString().padStart(2, '0')}`;
                div.setAttribute('date', datestr);
                div.setAttribute('index', idx);
                //--------------------
                //设置今日、选中日期、节假日等
                if (datestr == this.today && this.showToday) {//设置今日
                    div.classList.add('today');
                }
                if (datestr == this.date) {//设置当前日期
                    div.classList.add('active');
                }
                if (this.showPublicHoliday) {//设置预设公共节假日
                    let md = datestr.slice(5);
                    if (this.publicHoliday[md]) {
                        div.innerHTML += `<span class="day-h">${this.publicHoliday[md]}</span>`;
                    }
                }

            };
            this.hideBlankRow();
            if (this.showLunar) {
                if (typeof (rLunar) == "undefined") {
                    console.error('请先引入农历脚本文件');
                } else {
                    let data = rLunar.yueli(year, month);
                    this.renderLunar(data);
                }
            }
            return this;
        }
        renderLunar(days) {
            let daysdom = mycalendar.days;
            let idx = 1;
            for (let i = 0; i < daysdom.length; i++) {
                let dom = daysdom[i];
                if (dom.classList.contains('cday') && idx < days.length + 1) {
                    let d = dom.getAttribute('index');
                    let dinfo = days[d - 1];
                    let lday = dinfo['lday'];
                    let sd = dinfo['day'];
                    let cy = dinfo['lyearGz'];
                    let cm = dinfo['lmonthGz'];
                    let cd = dinfo['ldayGz'];
                    let jq = dinfo['jq'];
                    let str = dinfo['ldayCn'];
                    let cnY = dinfo['lyearCn'];
                    let cnM = dinfo['lmonthCn'];

                    if (jq && lday == 1) {
                        str = `<span class="term1">${jq}</span>|<span class="lunar1">${cnM}</span>`;
                    } else if (lday == 1) {
                        str = cnM;
                        dom.classList.add('lunar');
                    } else if (jq) {
                        str = dinfo['jq'];
                        dom.classList.add('term');
                    }
                    let cnMdx = dinfo['ldn'] == 30 ? '大' : '小';
                    let sx = dinfo['sx'];
                    let xz = dinfo['xz'];
                    let cnhtml = `${cnY}\n${cnM}[${cnMdx}]\n${sx}\n${xz}`;
                    dom.title = cnhtml;
                    let html = `<div>${sd} </div><div class='terms'>${str}</div>`;
                    let gzhtml = ` <div class="gz">${cy}年<br>${cm}月<br>${cd}日</div>`;
                    dom.innerHTML = html + gzhtml;
                    idx++;

                } else {
                    dom.className = 'day';
                }
            }
        }
        //============================
        hideBlankRow() {//隐藏日历空白行
            let rows = this.dom.querySelectorAll('tbody>tr');
            let _h = 0;
            this.dom.style.height = this.height + 'px';
            for (let row of rows) {
                row.classList.remove('hidden');
                if (!(row.innerHTML.includes('cday'))) {
                    row.classList.add('hidden');
                    _h++;
                };
            }
            this.dom.style.height = (this.height - _h * this.rowHeight) + 'px';
        };
    }
    window.rtianCalendar = rtianCalendar;
})(window, window.document);