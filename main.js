//var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 2;
var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 2;
var info_screen = {w: 720, h: 1100};

var info_screen0 = {w: Math.min(window.innerWidth, 720), h: Math.min(window.innerHeight, 1100)};
var info_screen1 = {w: window.innerWidth, h: window.innerHeight};
var canvas_x = (info_screen1.w - info_screen0.w) / 2;
var canvas_y = (info_screen1.h - info_screen0.h) / 2;
////
var sc_x = info_screen0.w / info_screen.w;
var sc_y = info_screen0.h / info_screen.h;

var impact = function (p_x, p_y, p_xx, p_yy, f_x, f_y, f_xx, f_yy, p_x_speed, p_y_speed, f_x_speed, f_y_speed) {
    var result = 0;
    //不能判定碰撞后相对位置，所以只能判定碰撞后，进行位置判断
    //p_x在f_x和f_xx之间时，不能判定从右边碰撞

    if (p_y > f_y && p_y < f_yy || p_yy > f_y && p_yy < f_yy) {
        if (p_x > f_x && p_x < f_xx || p_xx > f_x && p_xx < f_xx) {

            var r_x_speed = p_x_speed - f_x_speed;
            var r_y_speed = p_y_speed - f_y_speed;
            //console.log("x:"+r_x_speed,"y:"+r_y_speed);
            if (r_x_speed == 0) {
                //只能从上下碰撞,r_x_speed==0
                if (r_y_speed > 0) {
                    result = 1;
                } else if (r_y_speed < 0) {
                    result = 2;
                } else {
                    result = 5;
                    //console.log("Impact x and y relative speed error");
                }
            } else if (r_y_speed == 0) {
                //只能从左右进行碰撞,r_y_speed==0
                if (r_x_speed > 0) {
                    result = 3;
                } else if (r_x_speed < 0) {
                    result = 4;
                } else {
                    result = 5;
                    //console.log("Impact x and y relative speed error");
                }
            } else if (r_x_speed > 0 && r_y_speed > 0) {
                //这时候只能从目标的左或者上方进行碰撞"↘"
                //交叉相乘，避免分母0
                if ((p_yy - f_y) * r_x_speed < (p_xx - f_x) * r_y_speed) {
                    result = 1;
                } else {
                    result = 3;
                }

            } else if (r_x_speed < 0 && r_y_speed < 0) {
                //这时候只能从目标的右或者下方进行碰撞"↖"
                if ((f_yy - p_y ) * r_x_speed < (f_xx - p_x) * r_y_speed) {
                    result = 4;
                } else {
                    result = 2;
                }
            }
            else if (r_x_speed > 0 && r_y_speed < 0) {
                //这时候只能从目标的左或者下方进行碰撞"↗"
                if ((p_y - f_yy ) * r_x_speed < (p_xx - f_x) * r_y_speed) {
                    result = 3;
                } else {
                    result = 2;
                }
            }
            else if (r_x_speed < 0 && r_y_speed > 0) {
                //这时候只能从目标的右或者上方进行碰撞"↙"
                if ((p_yy - f_y) * r_x_speed < (p_x - f_xx) * r_y_speed) {
                    result = 4;
                } else {
                    result = 1;
                }
            }
        }
    }
    return result;
};

var main = function () {
    var T = Tina().requires("Input,Sprites,Scenes,Text,Entities")
        .setup("canvas", {
            x:canvas_x, y: canvas_y, width: info_screen0.w, height: info_screen0.h,
            pixelRatio: pixelRatio, scale: {x: sc_x, y: sc_y}
        })
        .controls();

    var startX = 0;
    var endX = 0;
    //var bg;

    ////(1)自定义类
    //玩家控制的人物
    var Player = T.Entity.extend({
        hp: 10,
        down_speed: 0.7,
        up_speed: 0,
        vertical_speed: 0,
        horizontal_speed: 0,
        load_act: 0,
        harm_time: -1,
        x_speed: 0,
        y_speed: 0,
        score: 0,
        init: function (ops) {
            this._super(ops);
            this.merge("frameAnim");
            this.setAnimSheet('player', 'player');
        },
        idle: function () {
            this.play("player_idle");
        },
        run: function () {
            this.play("player_run");
        },
        down: function () {
            this.play("player_down");
        },
        update: function (dt) {
            //如果玩家HP大于零时，才能接受按键操作
            if (this.hp > 0) {
                if (T.inputs['left']) {
                    this.scale.x = -1;
                    this.accel.x -= 6;
                }
                if (T.inputs['right']) {
                    this.scale.x = 1;
                    this.accel.x += 6;
                }
                if (endX - startX > 1) {
                    this.scale.x = -1;
                    this.accel.x -= 10;

                }
                if (endX - startX < -1) {
                    this.scale.x = 1;
                    this.accel.x += 10;
                }
            }
            if (this.hp <= 0 || this.y > 1070) {
                //这里可以添加死亡动画
                this.parent.pause();
                this.parent.add(new T.Sprite({z: 1000, asset: "bg_over.png", w: 720, h: 1100}));
                window.setTimeout(function () {
                    T.stageScene('ready');
                }, 2000);
            }
            if (this.score >= 100) {
                this.parent.pause();
                this.parent.add(new GameClear());
                window.setTimeout(function () {
                    T.stageScene('ready');
                }, 2000);
            }
            if (T.inputs['up']) {
                this.hp += 1;
            }
            if (T.inputs['down']) {
                this.score = 100;
            }
            if (this.hp > 10) {
                this.hp = 10;
            } else if (this.hp <= 0) {
                this.hp = 0;
            }
            //如果没有踩到楼梯时进行的动作
            if (this.load_act == 0 && this.vertical_speed < 8) {
                this.vertical_speed += this.down_speed;
            }

            //上边际判定
            if (this.y < 197 + this.w / 2 && this.harm_time == -1) {
                this.y = 198 + this.w / 2;
                this.vertical_speed = 5;
                this.hp -= 3;
                this.harm_time = 20;
            }

            //将所有的x和y方向的速度进行总和
            this.x_speed = this.accel.x + this.horizontal_speed;
            this.y_speed = this.accel.y + this.vertical_speed;
            //首先判定x方向是否有变化，如果没有变化
            if (this.accel.x != 0) {
                this.run();
            } else if (this.y_speed != 0 && this.load_act == 0) {
                this.down();
            } else {
                this.idle();
            }
            //根据速度对玩家x和y进行改变
            if ((this.x < (624 - this.w / 2) && this.x_speed > 0) || (this.x > (98 + this.w / 2) && this.x_speed < 0)) {
                this.x += this.x_speed;
            }

            this.y += this.y_speed;
            //将按键所赋的x和y方向的速度置0
            this.accel.x = 0;
            this.accel.y = 0;

            if (this.harm_time > -1) {
                this.harm_time--;
            }
            this._super(dt);

        }
    });
    var HpImg = T.Sprite.extend({
        w: 20, h: 42, asset: "hp.png", z: 102,
        init: function (ops) {
            this._super(ops);
        }
    });
    var HpView = T.Entity.extend({
        view_hp: 10, z: 101,
        init: function (ops) {
            this.on("added", function () {
                this.hpimg = new Array(10);
                for (var i = 0; i < this.hpimg.length; i++) {
                    var x = 142 + 20 * i;
                    this.hpimg[i] = new HpImg({
                        id: i,
                        x: x,
                        y: 50
                    });
                    this.parent.add(this.hpimg[i]);
                }

            });
        },
        update: function (dt) {

            if (player.hp < this.view_hp && player.hp >= 0) {
                for (; this.view_hp > player.hp; this.view_hp--) {
                    if (this.parent) {
                        this.parent.remove(this.hpimg[(this.view_hp - 1)])
                    }
                }
            } else if (player.hp > this.view_hp && player.hp <= 10) {
                for (; this.view_hp < player.hp; this.view_hp++) {
                    if (this.parent) {
                        this.parent.add(this.hpimg[(this.view_hp )]);
                    }
                }
            }

        }
    });
    var Score = T.Entity.extend({
        init: function (ops) {
            this.on("added", function () {
                this.parent.add(this.bai = new ScoreNumber({x: 550, y: 60}));
                this.parent.add(this.shi = new ScoreNumber({x: 600, y: 60}));
                this.parent.add(this.ge = new ScoreNumber({x: 650, y: 60}));
            });
        },
        update: function (dt) {
            this.bai.asset = parseInt(player.score / 100) + ".png";
            this.shi.asset = parseInt(player.score % 100 / 10) + ".png";
            this.ge.asset = player.score % 10 + ".png";
        }
    });
    var ScoreNumber = T.Entity.extend({
        z: 101, w: 20, h: 30,
        init: function (ops) {
            this._super(ops);
        }
    });
    var player;
    //最外层的框架
    var Frame = T.Entity.extend({
        asset: "frame.png", w: 720, h: 1100, x: 0, y: 0, z: 100
    });
    //楼梯间,会向上移动的墙壁
    var StairCase = T.Entity.extend({
        w: 636, h: 922, x: 45, y: 155,
        init: function (ops) {
            this.merge("frameAnim");
            this.setAnimSheet("sheet_staircase", "staircase");
            this.on("added", function () {
                this.play("moveup", 1, 1 / 3, {loop: true});
            });
        }
    });
    //普通楼梯
    var OrdinaryStair = T.Entity.extend({
        w: 160,
        h: 40,
        asset: "ordinarystair.png",
        center: {x: 80, y: 20},
        hp: 1,
        added_hp: false,
        id: 0,
        y_speed: -2,
        z: 98,
        init: function (ops) {
            this._super(ops);
            this.merge("frameAnim");
            this.initSheet();
        },
        initSheet: function () {//初始化sheet
        },
        action: function () {//人物碰到楼梯顶面触发楼梯的不同的反应行为,抽象函数，
        },
        leave: function () {//人物离开此楼梯时调用
            player.vertical_speed = 8;
        },
        hpchange: function () {//人物碰到楼梯顶面血量的变化
            if (!this.added_hp) {
                player.hp += this.hp;
                player.score++;
                this.added_hp = true;
            }
        },
        anim: function () {//楼梯动画
        },
        update: function (dt) {
            this.y_speed = -parseInt(player.score / 15) - 2;
            var result = impact(player.x - player.w / 2 + 3, player.y + player.h / 4, player.x + player.w / 2 - 3, player.y + player.h / 2, this.x - this.w / 2, this.y - this.h / 2, this.x + this.w / 2, this.y, player.x_speed, player.y_speed, 0, this.y_speed);
            this.y += this.y_speed;
            //碰撞检测
            if ((result == 1 || result == 5 ) && player.harm_time == -1) {//碰撞调用
                player.load_act = this.id;
                player.vertical_speed = this.y_speed;
                player.y = this.y - this.h / 2 - player.h / 3;
                this.hpchange();
                this.action();
            } else if (result == 0) {//没有碰撞时调用
                if (player.load_act == this.id) {//执行
                    player.load_act = 0;
                    this.leave();
                }
            }
            this.anim();
            if (this.y < 150 - this.h / 2) {//超过屏幕上边界，移除
                this.parent.remove(this);
            }
            this._super(dt);
        }
    });
    //尖刺楼梯
    var ThornStair = OrdinaryStair.extend({
        hp: -4, asset: "thornstair.png", center: {x: 80, y: 20}, w: 160, h: 40
    });
    //移动楼梯
    var ConveyorStair = OrdinaryStair.extend({
        center: {x: 80, y: 16}, w: 160, h: 32, scale: {x: 1, y: 1}, x_speed: 1,
        initSheet: function () {
            this.setAnimSheet("sheet_conveyorstair", "conveyorstair");
        },
        anim: function () {
            this.play("move", 1, 1 / 5, {loop: true});
        },
        action: function () {
            player.horizontal_speed = this.x_speed;
        },
        leave: function () {
            player.horizontal_speed = 0;
            player.vertical_speed = 8;
        }
    });
    //蹦床楼梯
    var TrampolineStair = OrdinaryStair.extend({
        center: {x: 60, y: 25}, actioning: 0, w: 120, h: 50, player_y_speed: -12,
        initSheet: function () {
            this.setAnimSheet("sheet_trampolinestair", "trampolinestair");
        },
        action: function () {
            this.actioning = 2;
            player.vertical_speed = this.player_y_speed;
        },
        leave: function () {
        },
        anim: function () {
            if (this.actioning > 0) {
                this.h = 25;
                this.center.y = 12;
                this.play("bounce");
                this.actioning--;
            } else {
                this.play("idle");
                this.h = 50;
                this.center.y = 25;
            }
        }
    });
    //易碎楼梯
    var FragileStair = OrdinaryStair.extend({
        w: 160, h: 60, center: {x: 80, y: 24}, fraged: false, fraging: 45,
        initSheet: function () {
            this.setAnimSheet("sheet_fragilestair", "fragilestair");
        },
        action: function () {
            if (!this.fraged) {
                this.fraged = true;
                this.play("frag");
            }
        },
        anim: function () {
            if (this.fraged) {
                this.fraging--;
                if (this.fraging == 30) {
                    player.harm_time = 3;
                    this.leave();
                }
                if (this.fraging == 0) {
                    this.parent.remove(this);
                }
            }
        }
    });
    //动态加载楼梯
    var LoadStair = T.Entity.extend({
        number: 1000,
        init: function (ops) {
            this.on("added", function () {
                this.id = 1;
                this.stairarray = new Array(this.number);
                this.stairarray[1] = new OrdinaryStair({x: 360, y: 1050, id: this.id});
                this.parent.add(this.stairarray[this.id++]);
                this.stairarray[2] = new OrdinaryStair({x: 200, y: 1150, id: this.id});
                this.parent.add(this.stairarray[this.id++]);
                this.stairarray[3] = new OrdinaryStair({x: 450, y: 1250, id: this.id});
                this.parent.add(this.stairarray[this.id++]);
            });
        },
        update: function (dt) {
            if (this.id < this.number && this.stairarray[this.id - 1].y < 1100) {
                var i = parseInt(Math.random() * 5);
                var x = parseInt(Math.random() * 360) + 180;
                var id = this.id;
                switch (i) {
                    case 0:
                        this.stairarray[id] = new OrdinaryStair({x: x, y: 1250, id: id});
                        break;
                    case 1:
                        this.stairarray[id] = new ThornStair({x: x, y: 1250, id: id});
                        break;
                    case 2:
                        var scale_x = parseInt(Math.random() * 2);
                        this.stairarray[id] = new ConveyorStair({x: x, y: 1250, id: id});
                        if (scale_x == 0) {
                            this.stairarray[id].scale.x = -1;
                            this.stairarray[id].x_speed = -this.stairarray[id].x_speed;
                        }
                        break;
                    case 3:
                        this.stairarray[id] = new TrampolineStair({x: x, y: 1250, id: id});
                        break;
                    case 4:
                        this.stairarray[id] = new FragileStair({x: x, y: 1250, id: id});
                        break;
                }
                this.parent.add(this.stairarray[this.id++]);
            }
        }
    });
    //通关背景
    var GameClear = T.Entity.extend({
        z: 110, w: 720, h: 1100, asset: "game_clear.png"
    });
    ////(2)场景
    var status;
    T.scene('ready', new T.Scene(function (stage) {
        stage.merge('interactive');
        status = 1;
        var bg0 = new T.Sprite({asset: "game_start.png", w: 720, h: 1100});
        stage.add(bg0);

        bg0.on("down", function () {
            if (status == 1) {
                T.stageScene('game');
            }
        });
        T.input.on('left', function () {
            if (status == 1) {
                T.stageScene('game');
            }
        });
        T.input.on('right', function () {
            if (status == 1) {
                T.stageScene('game');
            }
        });

    }, {sort: true}));

    T.scene("game", new T.Scene(function (stage) {
        stage.merge('interactive');
        status = 2;
        startX = 0;
        endX = 0;

        var bg = new T.Sprite({asset: "background.png", w: 720, h: 1100});

        bg.on("move", function (event) {
            if (startX != endX) {
                endX = startX;
            }
            startX = event.pos.x;
        });
        bg.on("up",function(event){
            endX = startX;
        });
        stage.add(bg);
        stage.add(new Frame());
        stage.add(new StairCase());
        stage.add(new HpView());
        stage.add(new Score());
        stage.add(new LoadStair());
        player = new Player({
            x: 360,
            y: 300,
            z: 99,
            speed: 50,
            rate: 1 / 5,
            w: 56,
            h: 56,
            center: {x: 28, y: 28}
        });
        stage.add(player);

        T.input.on('z', function () {
            if (!stage.paused) {
                stage.pause();
            } else {
                stage.unpause();
            }
        });
    }, {sort: true}));
    ////(3)加载资源
    T.load(["ordinarystair.png", "background.png", "bg_over.png", "conveyorstair.png", "trampolinestair.png", "fragilestair.png",
            "thornstair.png", "frame.png", "player.json", "player.png", "staircase.png", "frame.png", "hp.png", "0.png", "1.png",
            "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "game_start.png", "game_clear.png"],
        function () {
            T.sheet("sheet_conveyorstair", "conveyorstair.png", {tw: 160, th: 32});
            T.sheet("sheet_trampolinestair", "trampolinestair.png", {tw: 120, th: 43});
            T.sheet("sheet_fragilestair", "fragilestair.png", {tw: 160, th: 94});
            T.sheet("sheet_staircase", "staircase.png", {tw: 636, th: 922})
            T.compileSheets("player.png", "player.json");
            _.each([
                ["conveyorstair", {
                    move: {frames: _.range(0, 2), rate: 1 / 5}
                }],
                ["trampolinestair", {
                    bounce: {frames: _.range(0, 2), rate: 1},
                    idle: {frames: [0], rate: 1}
                }],
                ["fragilestair", {
                    frag: {frames: _.range(0, 9), rate: 1 / 5}
                }],
                ["player", {
                    player_idle: {frames: [0], rate: 1},
                    player_run: {frames: _.range(4, 7), rate: 1 / 3},
                    player_down: {frames: _.range(1, 4), rate: 1 / 4}
                }],
                ["staircase", {
                    moveup: {frames: _.range(0, 2), rate: 1 / 4}
                }]
            ], function (anim) {
                T.fas(anim[0], anim[1]);
            });
            window.setTimeout(function () {
                T.stageScene('ready');
            }, 300);

            T.input.on('x', function () {
                T.stageScene('ready');
            });
        }
    );
};