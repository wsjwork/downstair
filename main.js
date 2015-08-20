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
		.setup("canvas", {x: canvas_x, y: canvas_y, width: info_screen0.w, height: info_screen0.h,
			pixelRatio: pixelRatio, scale: {x: sc_x, y: sc_y}})
		.controls();
	////(1)自定义类
	//玩家控制的人物
	var player;
	var Player = T.Entity.extend({
		hp: 100,
		down_speed: 0,
		up_speed: 0,
		vertical_speed: 0,
		horizontal_speed: 0,
		fly_act: 0,
		fire_act: 0,
		load_act: 0,
		act_time: -1,
		die_time: -1,
		x_speed: 0,
		y_speed: 0,
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

		update: function (dt) {
			if (this.vertical_speed == 0 && this.load_act) {
				if (T.inputs['up']) {
					this.vertical_speed = 15;
				}
			} else {
				this.vertical_speed -= this.down_speed;
			}

			this.y -= this.vertical_speed;

			if (T.inputs['left']) {
				this.scale.x = -1;
				this.accel.x -= 4;
			}
			if (T.inputs['right']) {
				this.scale.x = 1;
				this.accel.x += 4;
			}
			if (this.accel.x != 0) {
				this.run();
			} else {
				this.idle();
			}
			this.x_speed = this.accel.x + this.horizontal_speed;
			this.y_speed = this.accel.y - this.vertical_speed;
			this.x += this.accel.x + this.horizontal_speed;
			this.accel.x = 0;
			this.y += this.accel.y;
			this.accel.y = 0;
			this._super(dt);
		}
	});

	//楼梯间,会向上移动的墙壁
	var StairCase = T.Entity.extend({
		w: 0, h: 0, x: 0, y: 0,
		update: function (dt) {
			this.y--;
			if (this.y < -140) {//重置图片位置
				this.y = 0;
			}
		}
	});
	//普通楼梯
	var OrdinaryStair = T.Entity.extend({
		w: 0, h: 0, asset: "ordinarystair.png", center: {x: 0, y: 0}, hp: 1, added: false,
		init: function (ops) {
			this._super(ops);
			this.merge("frameAnim");
		},
		action: function () {//人物碰到楼梯顶面触发楼梯的不同的反应行为,抽象函数，
		},
		hpchange: function () {//人物碰到楼梯顶面血量的变化
			if (!this.added) {
				player.hp += this.hp;
				this.added = true;
			}
		},
		update: function (dt) {
			this.y--;
//			impact()碰撞检测
			if (this.y < -this.h / 2) {//超过屏幕上边界，移除
				this.parent.remove(this);
			}
		}
	});
	//尖刺楼梯
	var ThornStair = OrdinaryStair.extend({
		hp: -1, harmed: false, asset: null, center: {x: 0, y: 0},
		action: function () {
		}
	});
	//移动楼梯
	var ConveyorStair = OrdinaryStair.extend({
		center: {x: 0, y: 0}, excursion: -1,
		init: function (ops) {
			this._super(ops);
			this.merge("frameAnim");
			this.setAnimSheet("sheet_conveyorstair", "conveyorstair");
			if (parseInt(Math.random() * 2) == 1) {
				this.excursion = 1;
			}
		},
		update: function (dt) {
			this.play("move");
		},
		action: function () {
			player.x += this.excursion;
		}
	});
	//蹦床楼梯
	var TrampolineStair = OrdinaryStair.extend({
		center: {x: 0, y: 0}, actioning: false,
		init: function (ops) {
			this._super(ops);
			this.merge("frameAnim");
			this.setAnimSheet("sheet_trampolinestair", "trampolinestair");
		},
		action: function () {
			this.play("bounce");
			this.actioning = true;
		},
		update: function () {
			this.y--;
			if (this.y < -this.h / 2) {//超过屏幕上边界，移除
				this.parent.remove(this);
			}
			//碰撞检测
			if (!this.actioning) {
				this.play("idle");
			}
		}
	});
	//易碎楼梯
	var FragileStair = OrdinaryStair.extend({
		init: function (ops) {
			this._super(ops);
			this.merge("frameAnim");
			this.setAnimSheet("sheet_fragilestair", "fragilestair");
		},
		action: function () {
		}
	});
	////(2)场景
	T.scene('stage', new T.Scene(function (stage) {
		stage.merge('interactive');
		var bg = new T.Sprite({asset: "background.png", w: 720, h: 1100});
		stage.add(bg);

		player = new Player({
			x: 300,
			y: 500,
			speed: 50,
			rate: 1 / 5,
			w: 54,
			h: 54,
			center: {x: 27, y: 27}
		});
		stage.add(player);

	}, {sort: true}));
	////(3)加载资源
	T.load(["ordinarystair.png", "background.png","player.json","player.png"//, "conveyorstair.png", "trampolinestair.png", "fragilestair.png"
	 ],
		function () {
//			T.sheet("sheet_conveyorstair", "conveyorstair.png", {tw: 0, th: 0});
//			T.sheet("sheet_trampolinestair", "trampolinestair.png", {tw: 0, th: 0});
//			T.sheet("sheet_fragilestair", "fragilestair.png", {tw: 0, th: 0});
			T.compileSheets("player.png","player.json");
			_.each([
				["conveyorstair", {
					move: {frames: _.range(0, 1), rate: 1}
				}],
				["trampolinestair", {
					bounce: {frames: _.range(0, 1), rate: 1},
					idle: {frames: [0], rate: 1}
				}],
				["fragilestair", {
					frag: {frames: _.range(0, 1), rate: 1}
				}],
				["player", {
					player_idle:{frames: [0], rate: 1},
					player_run:{frames: _.range(4,7), rate: 1/3},
					player_down:{frames: _.range(1,4), rate: 1/4}
				}]
			], function (anim) {
				T.fas(anim[0], anim[1]);
			});
			window.setTimeout(function () {
				T.stageScene('stage');
			}, 300);
		}
	);
};