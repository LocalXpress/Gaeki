'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Helper = function () {
    function Helper() {
        _classCallCheck(this, Helper);
    }

    Helper.objectToMatrix = function objectToMatrix(obj, cols) {
        var matrix = [],
            i = 0,
            len = obj.length,
            k = -1;
        while (i < len) {
            if (i % cols === 0) {
                k++;
                matrix[k] = [];
            }
            matrix[k].push(obj[i]);
            i++;
        }
        return matrix;
    };

    Helper.render = function render(fps, _render) {
        var fpsInterval = undefined,
            startTime = undefined,
            now = undefined,
            then = undefined,
            elapsed = undefined;

        fpsInterval = 1000 / fps;
        then = Date.now();
        startTime = then;

        (function animate() {
            requestAnimationFrame(animate);
            now = Date.now();
            elapsed = now - then;
            if (elapsed > fpsInterval) {
                then = now - elapsed % fpsInterval;
                _render();
            }
        })();
    };

    Helper.hasClass = function hasClass(element, cls) {
        return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
    };

    Helper.addClass = function addClass(el, className) {
        if (el instanceof HTMLElement) {
            if (el.classList) {
                el.classList.add(className);
            } else {
                el.className += ' ' + className;
            }
        } else {
            for (var i = 0, len = el.length; i < len; i++) {
                if (el[i].classList) {
                    el[i].classList.add(className);
                } else {
                    el[i].className += ' ' + className;
                }
            }
        }
    };

    Helper.removeClass = function removeClass(el, className) {
        if (el instanceof HTMLElement) {
            if (el.classList) {
                el.classList.remove(className);
            } else {
                el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        } else {
            for (var i = 0, len = el.length; i < len; i++) {
                if (el[i].classList) {
                    el[i].classList.remove(className);
                } else {
                    el[i].className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                }
            }
        }
    };

    Helper.closest = function closest(el, selector) {
        var matchesFn = undefined;
        ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
            if (typeof document.body[fn] == 'function') {
                matchesFn = fn;
                return true;
            }
            return false;
        });

        var parent = undefined;
        while (el) {
            parent = el.parentElement;
            if (parent && parent[matchesFn](selector)) {
                return parent;
            }
            el = parent;
        }

        return null;
    };

    _createClass(Helper, null, [{
        key: 'click',
        get: function get() {
            return navigator.userAgent.match(/iPad/i) ? 'touchstart' : 'click';
        }
    }]);

    return Helper;
}();

var MusicPlayer = function () {
    function MusicPlayer(ctx, opts) {
        _classCallCheck(this, MusicPlayer);

        this.ctx = ctx;
        this.divider = this.constructor.DEFAULTDIVIDER;
        this.filter = this.constructor.DEFAULTFILTER;

        if (_typeof(opts.tracks) === 'object') {
            this.makeTracks(opts.tracks);
        }
        this.track = document.querySelector('.track');

        this.audioSetup().tracklistControls().loadTrack().render().playCurrentTrack().changeVolume().changeTrack().events();
        if (typeof opts.autoplay === 'boolean' && opts.autoplay) {
            this.playTrack();
        }
    }

    MusicPlayer.prototype.audioSetup = function audioSetup() {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var audio = document.getElementById('mp3');
        audio.crossOrigin = "anonymous";
        var src = audioCtx.createMediaElementSource(audio);
        var analyser = audioCtx.createAnalyser();
        var data = new Uint8Array(analyser.frequencyBinCount);

        src.crossOrigin = 'anonymous';
        src.connect(analyser);
        analyser.connect(audioCtx.destination);

        this.audio = {
            ctx: audioCtx,
            el: audio,
            src: src,
            analyser: analyser,
            data: data
        };

        return this;
    };

    MusicPlayer.prototype.render = function render() {
        var Player = this;
        Helper.render(60, function () {
            if (!Player.audio.el.paused) {
                Player.audio.analyser.getByteFrequencyData(Player.audio.data);
                var data = Helper.objectToMatrix(Player.audio.data, Player.divider);
                var y = data.length,
                    x = Player.divider;
                while (y--) {
                    while (x--) {
                        var alpha = data[y][x];
                        if (alpha - Player.filter > 0) {
                            alpha = (alpha - Player.filter) / 255;
                        } else {
                            alpha = 0;
                        }
                        Player.ctx.clearRect(x * Player.w, y * Player.h, Player.w, Player.h);
                        Player.ctx.fillStyle = 'rgba(0,136,204,' + alpha + ')';
                        Player.ctx.fillRect(x * Player.w, y * Player.h, Player.w, Player.h);
                    }
                    x = Player.divider;
                }
            }
        });
        return this;
    };

    MusicPlayer.prototype.playCurrentTrack = function playCurrentTrack() {
        var playing = false,
            playel = document.getElementById('play'),
            Player = this;

        playel.addEventListener(Helper.click, function (e) {
            if (Helper.hasClass(Player.track, 'active')) {
                Player.pauseTrack();
            } else {
                Player.playTrack();
            }
        });

        return Player;
    };

    MusicPlayer.prototype.changeVolume = function changeVolume() {
        var volume = document.getElementById('volume'),
            Player = this;
        volume.addEventListener('input', function () {
            Player.audio.el.volume = this.value / 100;
        });
        volume.addEventListener('change', function () {
            Player.audio.el.volume = this.value / 100;
        });

        return this;
    };

    MusicPlayer.prototype.tracklistControls = function tracklistControls() {
        var control = document.getElementById('tracklist-control');
        var tracklist = document.getElementById('tracklist');
        control.addEventListener(Helper.click, function (e) {
            var parent = Helper.closest(e.target, '.track-list');
            if (Helper.hasClass(parent, 'active')) {
                Helper.removeClass(parent, 'active');
            } else {
                Helper.addClass(parent, 'active');
            }
        });
        return this;
    };

    MusicPlayer.prototype.makeTrack = function makeTrack(track, i) {
        var t = document.createElement('div');
        t.setAttribute('track-number', i);
        t.setAttribute('audio-src', track.src);
        t.setAttribute('artist', track.artist);
        Helper.addClass(t, 'track');

        var icon = document.createElement('i');
        Helper.addClass(icon, 'material-icons');
        icon.appendChild(document.createTextNode('play_circle_outline'));

        var name = document.createElement('span');
        name.appendChild(document.createTextNode(track.name));

        t.appendChild(icon);
        t.appendChild(name);

        return t;
    };

    MusicPlayer.prototype.makeTracks = function makeTracks(tracks) {
        var tracklist = document.querySelector('.track-list');
        for (var i = 0, len = tracks.length; i < len; i++) {
            tracklist.appendChild(this.makeTrack(tracks[i], i));
        }
        this.tracks = tracks;
    };

    MusicPlayer.prototype.changeTrack = function changeTrack() {
        var Player = this;
        for (var i = 0, len = Player.tracks.length; i < len; i++) {
            Player.tracks[i].addEventListener(Helper.click, function (e) {
                if (Helper.hasClass(e.target, 'track')) {
                    if (Player.track != e.target) {
                        Player.track = e.target;
                    }

                    if (Helper.hasClass(e.target, 'active')) {
                        Player.pauseTrack();
                    } else {
                        Player.loadTrack(true);
                        Helper.removeClass(Helper.closest(e.target, '.track-list'), 'active');
                    }
                }
                e.stopPropagation();
                return false;
            });
        }

        return this;
    };

    MusicPlayer.prototype.playPreviousTrack = function playPreviousTrack() {
        var current = parseInt(this.track.getAttribute('track-number'));
        var previous = current <= 0 ? this.tracks.length - 1 : current - 1;
        this.track = this.tracks[previous];
        this.loadTrack(true);

        return this;
    };

    MusicPlayer.prototype.playNextTrack = function playNextTrack() {
        var current = parseInt(this.track.getAttribute('track-number'));
        var next = current > this.tracks.length ? 0 : current + 1;
        this.track = this.tracks[next];
        this.loadTrack(true);

        return this;
    };

    MusicPlayer.prototype.shuffle = function shuffle() {
        var tracknumber = Math.floor(Math.random() * this.tracks.length);
        while (tracknumber == parseInt(this.track.getAttribute('track-number'))) {
            tracknumber = Math.floor(Math.random() * this.tracks.length);
        }
        this.track = this.tracks[tracknumber];
        this.loadTrack(true);

        return this;
    };

    MusicPlayer.prototype.loadTrack = function loadTrack(autoplay) {
        this.audio.el.removeAttribute('src');
        this.audio.el.setAttribute('src', this.track.getAttribute('audio-src'));
        // this.audioSetup();

        var artist = document.querySelector('.track-artist');
        var name = document.querySelector('.track-name');

        artist.innerText = this.track.getAttribute('artist');
        name.innerText = this.track.querySelector('span').innerText;

        if (typeof autoplay === 'boolean' && autoplay) {
            this.playTrack();
        }

        return this;
    };

    MusicPlayer.prototype.playTrack = function playTrack() {
        Helper.removeClass(this.tracks, 'active');
        var icons = document.getElementById('tracklist').querySelectorAll('.material-icons');
        for (var j = 0, jlen = icons.length; j < jlen; j++) {
            icons[j].innerHTML = 'play_circle_outline';
        }

        Helper.addClass(this.track, 'active');
        this.track.querySelector('.material-icons').innerHTML = 'pause_circle_outline';
        this.audio.el.play();
        this.audio.el.crossOrigin = 'anonymous';
        this.audio.el.volume = volume.value / 100;
        document.getElementById('play').setAttribute('playing', 'playing');

        var Player = this;
        this.audio.el.addEventListener('ended', function () {
            Player.audio.el.currentTime = 0;
            Player.audio.el.pause();
            if (Player.shuffling) {
                Player.shuffle();
            } else {
                if (parseInt(Player.audio.el.getAttribute('track-number')) < Player.tracks.length) {
                    Player.playNextTrack();
                } else {
                    if (Player.repeating) {
                        Player.playNextTrack();
                    }
                }
            }
        });
    };

    MusicPlayer.prototype.pauseTrack = function pauseTrack() {
        Helper.removeClass(this.track, 'active');
        this.track.querySelector('.material-icons').innerHTML = 'play_circle_outline';
        this.audio.el.pause();
        document.getElementById('play').removeAttribute('playing');

        return this;
    };

    MusicPlayer.prototype.events = function events() {
        var Player = this;
        document.querySelector('.shuffle').addEventListener(Helper.click, function (e) {
            Helper.removeClass(document.querySelectorAll('.controls div'), 'active');
            Player.repeating = false;
            if (Player.shuffling) {
                Player.shuffling = false;
            } else {
                Player.shuffling = true;
                Helper.addClass(e.target, 'active');
            }
        });
        document.querySelector('.repeat').addEventListener(Helper.click, function (e) {
            Helper.removeClass(document.querySelectorAll('.controls div'), 'active');
            Player.shuffling = false;
            if (Player.repeating) {
                Player.repeating = false;
            } else {
                Player.repeating = true;
                Helper.addClass(e.target, 'active');
            }
        });
        document.querySelector('.next').addEventListener(Helper.click, function () {
            Player.shuffling = false;
            Player.playNextTrack();
        });
        document.querySelector('.previous').addEventListener(Helper.click, function () {
            Player.shuffling = false;
            Player.playPreviousTrack();
        });
    };

    _createClass(MusicPlayer, [{
        key: 'ctx',
        get: function get() {
            return this._ctx;
        },
        set: function set(val) {
            this._ctx = val;
        }
    }, {
        key: 'divider',
        get: function get() {
            return this._divider;
        },
        set: function set(val) {
            this._divider = val;
        }
    }, {
        key: 'filter',
        get: function get() {
            return this._filter;
        },
        set: function set(val) {
            this._filter = val;
        }
    }, {
        key: 'w',
        get: function get() {
            return this.ctx.canvas.width / this.divider;
        }
    }, {
        key: 'h',
        get: function get() {
            return this.ctx.canvas.height / this.divider;
        }
    }, {
        key: 'audio',
        get: function get() {
            return this._audio;
        },
        set: function set(val) {
            this._audio = val;
        }
    }, {
        key: 'track',
        get: function get() {
            return this._track;
        },
        set: function set(val) {
            this._track = val;
        }
    }, {
        key: 'tracks',
        get: function get() {
            return this._tracks = document.querySelectorAll('.track');
        },
        set: function set(val) {
            this._tracks = val;
        }
    }, {
        key: 'shuffling',
        get: function get() {
            return this._shuffling;
        },
        set: function set(val) {
            this._shuffling = val;
        }
    }, {
        key: 'repeating',
        get: function get() {
            return this._repeating;
        },
        set: function set(val) {
            this._repeating = val;
        }
    }], [{
        key: 'DEFAULTDIVIDER',
        get: function get() {
            return 32;
        }
    }, {
        key: 'DEFAULTFILTER',
        get: function get() {
            return 0;
        }
    }]);

    return MusicPlayer;
}();

window.onload = function () {
    var tracklist = [{
        src: 'https://ia801703.us.archive.org/1/items/Jerryc-CanonRock/01-CanonRock.mp3',
        name: 'Canon Rock',
        artist: 'JerryC'
    }, {
        src: 'https://ia801703.us.archive.org/0/items/Acdc-Thunderstruck/A1-Thunderstruck_01.mp3',
        name: 'Thunderstruck',
        artist: 'AC/DC'
    }, {
        src: 'https://ia700408.us.archive.org/29/items/ToZanarkand/FinalFantasyX-ToZanarkandpianoVersion.mp3',
        name: 'To Zanarkand',
        artist: 'Nobuo Uematsu'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/nobuo-uematsu-the-promise.mp3',
        name: 'The Promise',
        artist: 'Nobuo Uematsu'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/dunderpatrullen-singularity.mp3',
        name: 'Singularity',
        artist: 'Dunderpatrullen'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/lol-bit-rush.mp3',
        name: 'Bit Rush',
        artist: 'League Of Legends'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/lol-worlds-collide.mp3',
        name: 'World\'s Collide',
        artist: 'League Of Legends'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/hatsune-miku-secret-police.mp3',
        name: 'Secret Police',
        artist: 'Hatsune Miku'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/hatsune-miku-senbonzakura.mp3',
        name: 'Senbonzakura',
        artist: 'Hatsune Miku'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/hatsune-miku-talent-shredder.mp3',
        name: 'Talent Shredder',
        artist: 'Hatsune Miku'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/one-punch-man-opening-1.mp3',
        name: 'Hero',
        artist: 'One Punch Man'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/44k_dainanaiseki.mp3',
        name: 'Intro Sequence',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/44k_boss.mp3',
        name: 'Boss Fight',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/battle_lastboss1st.mp3',
        name: 'Last Boss Fight 1',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/battle_lastboss2nd.mp3',
        name: 'Last Boss Fight 2',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/battle_zombieboss.mp3',
        name: 'Zombie Boss Fight',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/Battle3.mp3',
        name: 'Battle 3',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/Battle8.mp3',
        name: 'Battle 8',
        artist: 'Planet Ruler'
    }, {
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/uta96_final_loud_3.mp3',
        name: 'Outro',
        artist: 'Planet Ruler'
    },{
        src: 'http://cdn.zekken.rocks/mp3/planet-ruler/uta96_final_loud_3.mp3',
        name: 'Outro@',
        artist: 'Planet Ruler'
    }];

    var ctx = document.getElementById('canvas').getContext('2d');
    var player = new MusicPlayer(ctx, {
        tracks: tracklist
    });
};