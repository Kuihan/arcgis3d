!function (g, animate, render) {
	var animates = [];
	g.animateLine = function (graphic, r, type, param) { // 函数定义
		var scene = param.scene, // three场景函数
			externalRenderers = param.externalRenderers,   // arcgis渲染器
			img1 = param.opacity,				 // 透明度图片
			img2 = param.img,						// 动画图片
			speed = param.speed,					// 速度
			AngleError = param.AngleError,			// 每个点的调度误差 [0,0,0,0]
			lineRError = param.lineRError;           // 每个点的距离误差 [0,0,0,0]
		var key = new animate(scene, externalRenderers, img1, img2);
		lineRError && (key.lineRError = lineRError);
		AngleError && (key.AngleError = AngleError);
		speed && (key.speed = speed);
		img1 && (key.opacity = img1);
		img2 && (key.img = img2);
		animates.push(key);
		key.animates = animates;
		key.createGraphic(graphic, r, type);
		return key;
	};
	g.animateLine.render = function () {
		animates.forEach((ems) => {
			ems.renderDongtaiqiang();
		})
	};
}(window, function (scene, externalRenderers) {

	var scene = scene;

	this.opacity = '';
	this.img = '';

	var imgs = [];
	var imgs1 = [];

	var speed = this.speed = 0;

	var wai = true;

	var AngleError = this.AngleError = [-12, 32, -30, 30, -12];
	var lineRError = this.AngleError = [0, 0, 0, 0, 0]

	/** 
	 *  graphic 需要创建的几何对象
	 *  r       动态线的宽度
	 *  type    线的动画方向 0顺 11,9内 2顺时针 3逆时针
	 * */
	var createGraphic = this.createGraphic = function (graphic, r, type) { // 主要部分
		r = r || 5;
		var points = graphic.geometry.rings[0];
		console.log(points)
		// 求出几何的中心点
		var center = graphic.geometry.centroid
		// debugger;
		points.forEach((p0, i, s) => { // p0当前元素，i数组下标，s数组对象
			if (i === s.length - 1) return;
			var p1 = s[i + 1];
			// 求出2点之间的角度
			var deg = pointCenter.deg([center.x, center.y], p0);
			var deff = r;
			var p2 = pointCenter.getOffset([p0[0], p0[1]], deg + (AngleError[i] || 0), deff + (lineRError[i] || 0));
			var deg = pointCenter.deg([center.x, center.y], p1);
			var deff = r;
			var p3 = pointCenter.getOffset([p1[0], p1[1]], deg + (AngleError[i + 1] || 0), deff + (lineRError[i] || 0));

			if (!type || type === 0) {
				dongtaiqiang(p0, p1, p2, p3);
			} else if (type === 1) {
				dongtaiqiang(p1, p2, p3, p0);
			} else if (type === 2) {
				dongtaiqiang(p2, p3, p0, p1);
			} else if (type === 3) {
				dongtaiqiang(p3, p0, p1, p2);


			} else if (type === 4) {
				dongtaiqiang(p0, p2, p3, p1);
			} else if (type === 5) {
				dongtaiqiang(p2, p3, p1, p0);
			} else if (type === 6) {
				dongtaiqiang(p3, p1, p0, p2);
			} else if (type === 7) {
				dongtaiqiang(p1, p0, p2, p3);


			} else if (type === 8) {
				dongtaiqiang(p0, p3, p1, p2);
			} else if (type === 9) {
				dongtaiqiang(p3, p1, p2, p0);
			} else if (type === 10) {
				dongtaiqiang(p1, p2, p0, p3);
			} else if (type === 11) {
				dongtaiqiang(p2, p0, p3, p1);
				wai = false;

			} else if (type === 12) {
				dongtaiqiang(p0, p3, p2, p1);
			} else if (type === 13) {
				dongtaiqiang(p3, p2, p1, p0);
			} else if (type === 14) {
				dongtaiqiang(p2, p1, p0, p3);
			} else if (type === 15) {
				dongtaiqiang(p1, p0, p3, p2);
			}
		})
	}

	this.renderDongtaiqiang = function () {
		imgs.forEach((texture) => {
			if (wai) {
				if (texture.offset.y <= 0) {
					texture.offset.y = 1;
				} else {
					texture.offset.y -= 0.02 + speed; // 每次渲染就向上移动0.02个单位，如果想要速度快就增大该值
				}
			} else {
				if (texture.offset.y >= 1) {
					texture.offset.y = 0;
				} else {
					texture.offset.y += 0.02 + speed; // 每次渲染就向上移动0.02个单位，如果想要速度快就增大该值
				}
			}

			if (texture) {
				texture.offset.set(0, texture.offset.y); // 水平偏移量0，垂直方向偏移量为offset
			}
		})
	}

	var dongtaiqiang = function (a, a1, p, p1) {
		var points = [a, a1, p, p1]
		let transform = new THREE.Matrix4(); // 变换矩阵
		let transformation = new Array(16);
		let vector3List = []; // 顶点数组
		points.forEach((point) => {
			// 将经纬度坐标转换为xy值
			// let pointXY = webMercatorUtils.lngLatToXY(point[0], point[1]);
			if (!point) return;
			let pointXY = point;
			// 先转换高度为0的点
			transform.fromArray(
				externalRenderers.renderCoordinateTransformAt(
					view,
					[pointXY[0], pointXY[1], 1], // 坐标在地面上的点[x值, y值, 高度值]
					view.spatialReference,
					transformation
				)
			);
			vector3List.push(
				new THREE.Vector3(
					transform.elements[12],
					transform.elements[13],
					transform.elements[14]
				)
			);
		});


		const t0 = new THREE.Vector2(0, 0); // 图片左下角
		const t1 = new THREE.Vector2(1, 0); // 图片右下角
		const t2 = new THREE.Vector2(1, 1); // 图片右上角
		const t3 = new THREE.Vector2(0, 1); // 图片左上角

		let faceList = []; // 三角面数组
		let faceVertexUvs = []; // 面的 UV 层的队列，该队列用于将纹理和几何信息进行映射

		for (let i = 0; i < vector3List.length - 2; i++) {
			if (i % 2 === 0) { // 下三角面
				faceList.push(new THREE.Face3(i, i + 2, i + 1));
				faceVertexUvs.push([t0, t1, t3]);
			} else { // 上三角面
				faceList.push(new THREE.Face3(i, i + 1, i + 2));
				faceVertexUvs.push([t3, t1, t2]);
			}
		}

		const geometry = new THREE.Geometry(); // 生成几何体
		geometry.vertices = vector3List; // 几何体顶点
		geometry.faces = faceList; // 几何体三角面
		geometry.faceVertexUvs[0] = faceVertexUvs; // 面的UV队列，用于将纹理信息映射到几何体上

		const geometry2 = geometry.clone();

		var alphaMap = new THREE.TextureLoader().load( // 加载alpha贴图资源
			'./images/Textures/line2.png'
		);
		// 创建材质
		const material = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			side: THREE.DoubleSide,
			transparent: true, // 必须设置为true,alphaMap才有效果
			depthWrite: false, // 渲染此材质是否对深度缓冲区有任何影响
			alphaMap: alphaMap, // alpha贴图，控制透明度
		});
		const mesh = new THREE.Mesh(geometry, material); // 第一个几何体和第一个材质

		var texture = window.texture = new THREE.TextureLoader().load(
			'./images/Textures/line2.png'
		);
		texture.wrapS = THREE.RepeatWrapping; // 水平方向重复
		texture.wrapT = THREE.RepeatWrapping; // 垂直方向重复
		const material2 = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false, // 渲染此材质是否对深度缓冲区有任何影响
			map: texture, // 颜色贴图，加载PNG图片达到透明效果
		});
		const mesh2 = new THREE.Mesh(geometry2, material2);
		scene.add(mesh2);
		imgs1.push(mesh2);
		imgs.push(texture);
	};

	var pointCenter = window.ut = {
		// 计算以p1为圆心，p2相对于p1的圆心角
		deg(p1, p2) {
			var x = p1[0] - p2[0];
			var y = p1[1] - p2[1];
			var deg = Math.atan(Math.abs(x / y)) * 180 / Math.PI
			if (x > 0) {
				if (y > 0) {
					// 第三象限
					deg = 180 + deg;
				} else {
					// 第二象限
					deg = 360 - deg;
				}
			} else {
				if (y > 0) {
					// 第四象限
					deg = 180 - deg;
				} else {
					// 第一象限
					deg = deg;
				}
			}
			return deg;
		},

		// 求兩點之間的距離
		deff(p1, p2) {
			var x = Math.abs(p1[0] - p2[0]);
			var y = Math.abs(p1[1] - p2[1]);
			var diff = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
			return diff;
		},

		// 根据角度和距离求出居里点
		getOffset(xys, deg, deff) {
			deg = deg % 360;
			if (deg < 90) {
				// 第一象限
				var x = Math.abs((Math.sin(deg * Math.PI / 180) * deff));
				var y = Math.abs((Math.cos(deg * Math.PI / 180) * deff));
			} else if (deg < 180) {
				// 第四象限
				deg = 90 - deg;
				var x = Math.abs((Math.cos(deg * Math.PI / 180) * deff)) * 1;
				var y = Math.abs((Math.sin(deg * Math.PI / 180) * deff)) * -1;
			} else if (deg < 270) {
				// 第三象限
				deg = 180 - deg;
				var x = Math.abs((Math.sin(deg * Math.PI / 180) * deff)) * -1;
				var y = Math.abs((Math.cos(deg * Math.PI / 180) * deff)) * -1;
			} else if (deg < 360) {
				// 第二象限
				deg = 270 - deg;
				var x = Math.abs((Math.cos(deg * Math.PI / 180) * deff)) * -1;
				var y = Math.abs((Math.sin(deg * Math.PI / 180) * deff));
			}
			xys[0] += x;
			xys[1] += y;
			return xys;
		}
	}

	this.remove = function () {
		imgs1.forEach((e) => { scene.remove(e) });
		this.animates.splice(this.animates.indexOf(this), 1);
	}
})
