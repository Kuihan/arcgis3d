var lizi = []
var dir = []
var offset = 1
var allpl
var rectLight

function laln2xy(ln, la, h) {
    let transform = new THREE.Matrix4()
    let transformation = new Array(16)
    let pointXY = webMercatorUtils.lngLatToXY(ln, la)
    transform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
            view,
            [pointXY[0], pointXY[1], h], // 坐标在地面上的点[x值, y值, 高度值]
            view.spatialReference,
            transformation
        )
    );
    return new THREE.Vector3(transform.elements[12], transform.elements[13], transform.elements[14])
}

function randomPoints(geo) {
    for (let i = 0; i < 100; i++) {
        let x = Math.random() * 10 - 5
        let y = Math.random() * 10 - 5
        let z = Math.random() * 10 - 5
        let t = new THREE.Vector3(x, y, z)
        geo.vertices.push(t)
    }
}

function addPoint(pa, scene, num) {
    var allChildren = scene.children;
    if (num >= 20) {
        for (let i = 0; i < allChildren.length; i++) {
            var object = allChildren[i]
            if (object instanceof THREE.Points) {
                scene.remove(object);
                break
            }
        }
    }
    scene.add(pa)
}

function shootPoint(st, d, scene, g) {
    var pointsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 80,
        transparent: true,
        blending: THREE.AdditiveBlending,
        map: createLightMateria()
    })
    // var Geometry = THREE.Geometry()
    // Geometry.vertices.push(new THREE.Vector3(0, 0, 0))
    var point = new THREE.Points(g, pointsMaterial)
    scene.add(point)
    if (lizi.length > 20) {
        lizi.shift()
        dir.shift()
        let allChildren = scene.children
        for (let i = 0; i < allChildren.length; i++) {
            let object = allChildren[i]
            if (object instanceof THREE.Points) {
                scene.remove(object)
                break
            }
        }
    }
    lizi.push(point)
    let x = Math.random() * offset - offset / 2
    let y = Math.random() * offset - offset / 2
    let z = Math.random() * offset - offset / 2
    dir.push(new THREE.Vector3(d.x + x, d.y + y, d.z + z))
    for (let i = 0; i < lizi.length; i++) {
        lizi[i].position.set(st.x + i * dir[i].x, st.y + i * dir[i].y, st.z + i * dir[i].z)
    }
}

function getAngle(x, y, costheta) {
    if (y > 0) {
        return Math.acos(costheta)
    } else {
        return 2 * Math.PI - Math.acos(costheta)
    }
}

function createRecFromLine(x1, y1, x2, y2, r) {
    let dx = x1 - x2
    let dy = y1 - y2
    let costheta = dx / Math.sqrt(dx * dx + dy * dy)
    let theta = getAngle(dx, dy, costheta)
    let dx2 = r / 2 * Math.cos(theta - Math.PI / 2)
    let dy2 = r / 2 * Math.sin(theta - Math.PI / 2)
    let x3 = x1 + dx2
    let y3 = y1 + dy2
    let x4 = x1 - dx2
    let y4 = y1 - dy2
    let x5 = x2 + dx2
    let y5 = y2 + dy2
    let x6 = x2 - dx2
    let y6 = y2 - dy2
    return [[x3, y3], [x4, y4], [x5, y5], [x6, y6]]
}

function createPLFromRec(verticesList, r) {
    let plist = []
    const sphere = new THREE.SphereGeometry(4, 16, 8)
    const bigsphere = new THREE.SphereGeometry(10, 16, 8)
    // 创建该矩形的外接矩形
    let xmin = 100000000
    let xmax = -100000000
    let ymin = 100000000
    let ymax = -100000000
    let lightStrength = 150
    let xminindex, xmaxindex, yminindex, ymaxindex
    for (let i = 0; i < verticesList.length; i++) {
        if (verticesList[i][0] < xmin) xmin = verticesList[i][0], xminindex = i
        if (verticesList[i][0] > xmax) xmax = verticesList[i][0], xmaxindex = i
        if (verticesList[i][1] < ymin) ymin = verticesList[i][1], yminindex = i
        if (verticesList[i][1] > ymax) ymax = verticesList[i][1], ymaxindex = i
    }
    let x1 = verticesList[ymaxindex][0]
    let y1 = verticesList[ymaxindex][1]
    let x2 = verticesList[xminindex][0]
    let y2 = verticesList[xminindex][1]
    let x3 = verticesList[yminindex][0]
    let y3 = verticesList[yminindex][1]
    let x4 = verticesList[xmaxindex][0]
    let y4 = verticesList[xmaxindex][1]
    if (y2 > y4) {
        for (let i = y1; i > y3; i -= r) {
            let start, end
            if (i > verticesList[xminindex][1]) {
                start = x1 - (x1 - x2) * (y1 - i) / (y1 - y2)
                end = x1 + (x4 - x1) * (y1 - i) / (y1 - y4)
            } else if (i > verticesList[xmaxindex][1]) {
                start = x3 - (x3 - x2) * (i - y3) / (y2 - y3)
                end = x1 + (x4 - x1) * (y1 - i) / (y1 - y4)
            } else {
                start = x3 - (x3 - x2) * (i - y3) / (y2 - y3)
                end = x3 + (x4 - x3) * (i - y3) / (y4 - y3)
            }
            for (let j = start; j < end; j += r) {
                let pl = new THREE.PointLight(0xffc600, 1, lightStrength) // 光照强度减为0的距离设为0，让光可以无限延伸
                let p = laln2xy(j, i, 1)
                pl.position.set(p.x, p.y, p.z)
                plist.push(pl)
            }
        }
    } else {
        for (let i = y1; i > y3; i -= r) {
            let start, end
            if (i > verticesList[xmaxindex][1]) {
                start = x1 - (x1 - x2) * (y1 - i) / (y1 - y2)
                end = x1 + (x4 - x1) * (y1 - i) / (y1 - y4)
            } else if (i > verticesList[xminindex][1]) {
                start = x1 - (x1 - x2) * (y1 - i) / (y1 - y2)
                end = x3 + (x4 - x3) * (i - y3) / (y4 - y3)
            } else {
                start = x3 - (x3 - x2) * (i - y3) / (y2 - y3)
                end = x3 + (x4 - x3) * (i - y3) / (y4 - y3)
            }
            for (let j = start; j < end; j += r) {
                let pl = new THREE.PointLight(0xffc600, 1, lightStrength)
                let p = laln2xy(j, i, 1)
                pl.position.set(p.x, p.y, p.z)
                plist.push(pl)
            }
        }
    }
    return plist
}

function addLight(pl1, pl2, pl3, pl4, scene) {
    let pl = []
    for (let i = 0; i < pl1.length; i++) {
        pl.push(pl1[i])
    }
    for (let i = 0; i < pl2.length; i++) {
        pl.push(pl2[i])
    }
    for (let i = 0; i < pl3.length; i++) {
        pl.push(pl3[i])
    }
    for (let i = 0; i < pl4.length; i++) {
        pl.push(pl4[i])
    }
    for (let i = 0; i < pl.length; i++) {
        scene.add(pl[i])
    }
    return pl
}

function createWall(h, x1, y1, x2, y2) {
    let t1 = laln2xy(x1, y1, 1)
    let t2 = laln2xy(x2, y2, 1)
    let t3 = laln2xy(x1, y1, 1 + h)
    let t4 = laln2xy(x2, y2, 1 + h)
    let loc = laln2xy((x1 + x2) / 2, (y1 + y2) / 2, 1 + h / 2)
    let widthmid = laln2xy((x1 + x2) / 2, (y1 + y2) / 2, 1 + h)
    let d = new THREE.Vector3(widthmid.x - loc.x, widthmid.y - loc.y, widthmid.z - loc.z)
    let height = 2 * Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
    let width = Math.sqrt((t1.x - t2.x) * (t1.x - t2.x) + (t1.y - t2.y) * (t1.y - t2.y) + (t1.z - t2.z) * (t1.z - t2.z))
    var alpha = new THREE.TextureLoader().load('./images/Textures/2.png')
    var wallMaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, transparent: true, alphaMap: alpha })
    // 通过修改顶点坐标的方法使平面加载到指定位置
    let wall = new THREE.PlaneGeometry(width, height)
    wall.vertices[0] = new THREE.Vector3(t1.x - loc.x, t1.y - loc.y, t1.z - loc.z)
    wall.vertices[1] = new THREE.Vector3(t2.x - loc.x, t2.y - loc.y, t2.z - loc.z)
    wall.vertices[2] = new THREE.Vector3(t3.x - loc.x, t3.y - loc.y, t3.z - loc.z)
    wall.vertices[3] = new THREE.Vector3(t4.x - loc.x, t4.y - loc.y, t4.z - loc.z)
    var mesh = new THREE.Mesh(wall, wallMaterial)
    mesh.position.set(loc.x, loc.y, loc.z)
    return mesh
}

function createLightMateria() {
    let canvasDom = document.createElement('canvas')
    canvasDom.width = 8
    canvasDom.height = 8
    let ctx = canvasDom.getContext('2d')
    let gradient = ctx.createRadialGradient(
        canvasDom.width / 2,
        canvasDom.height / 2,
        0,
        canvasDom.width / 2,
        canvasDom.height / 2,
        canvasDom.width / 2
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 0, 1)')
    gradient.addColorStop(0.4, 'rgba(64, 0, 0, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvasDom.width, canvasDom.height)
    let texture = new THREE.Texture(canvasDom)
    texture.needsUpdate = true
    return texture
}

function createPoints(h, x1, y1, x2, y2, sec) {
    var pointsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 80,
        transparent: true,
        blending: THREE.AdditiveBlending,
        map: createLightMateria()
    })
    let points = new THREE.Geometry()
    let t1 = laln2xy(x1, y1, 1)
    let t2 = laln2xy(x2, y2, 1)
    let t3 = laln2xy(x1, y1, 1 + h)
    let t4 = laln2xy(x2, y2, 1 + h)
    // console.log('h', h)
    let wsec = new THREE.Vector3((t2.x - t1.x) / sec, (t2.y - t1.y) / sec, (t2.z - t1.z) / sec)
    let hsec = new THREE.Vector3((t3.x - t1.x) / sec * 10, (t3.y - t1.y) / sec * 10, (t3.z - t1.z) / sec * 10)
    for (let i = 0; i < sec / 10; i++) {
        for (let j = 0; j < sec; j++) {
            let pos = new THREE.Vector3(t1.x + i * hsec.x + j * wsec.x, t1.y + i * hsec.y + j * wsec.y, t1.z + i * hsec.z + j * wsec.z)
            points.vertices.push(pos)
        }
    }
    let pointField = new THREE.Points(points, pointsMaterial)
    return pointField
}

function addPoints(x1, y1, x2, y2, x3, y3, x4, y4, h, scene) {
    const sec = 100
    let st = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2))
    let l1 = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
    let l3 = Math.sqrt((x3 - x4) * (x3 - x4) + (y3 - y4) * (y3 - y4))
    let l4 = Math.sqrt((x1 - x4) * (x1 - x4) + (y1 - y4) * (y1 - y4))
    let p1 = createPoints(h, x1, y1, x2, y2, l1 / st * sec)
    let p2 = createPoints(h, x2, y2, x3, y3, sec) // sec = 100
    let p3 = createPoints(h, x3, y3, x4, y4, l3 / st * sec)
    let p4 = createPoints(h, x4, y4, x1, y1, l4 / st * sec)
    scene.add(p1)
    scene.add(p2)
    scene.add(p3)
    scene.add(p4)
}

function addFog(scene) {
    scene.fog = new THREE.FogExp2( 0xffffff, 0.001)
    var light = new THREE.AmbientLight( 0xffff00 )
    scene.add( light )
}

function createCylinder (points, scene) {
    // 设置圆柱体常量
    const upRadius = 2
    const underRadius = 2
    const segment = 32
    var plsec
    for (let k = 0; k < points.length - 1; k++) {
        let p1 = points[k]
        let p2 = points[k + 1]
        // 起点st，终点en
        let st = laln2xy(p1[0], p1[1], 5)
        let en = laln2xy(p2[0], p2[1], 5)
        let hpoint = laln2xy((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, 50)
        let lpoint = laln2xy((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, 0)
        let cyheight = Math.sqrt((st.x - en.x) * (st.x - en.x) + (st.y - en.y) * (st.y - en.y) + (st.z - en.z) * (st.z - en.z))
        if (k === 0) {
            plsec = cyheight / 20 // 计算点光源间距
        }
        var geometry = new THREE.CylinderGeometry( upRadius, underRadius, cyheight, segment );
        var emissive = new THREE.TextureLoader().load('./images/Textures/6.png')
        var material = new THREE.MeshPhysicalMaterial( {emissive: 0xffffff, emissiveMap: emissive} );
        var cylinder = new THREE.Mesh( geometry, material );
        scene.add( cylinder );
        var sphereObject = new THREE.SphereGeometry( upRadius, 32, 32 );
        var spherematerial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, transparent: true, alphaMap: alpha})
        var sphere = new THREE.Mesh( sphereObject, spherematerial );
        scene.add( sphere );
        sphere.position.set(st.x, st.y, st.z)
        // 对刚创建的圆柱几何对象进行旋转
        let loc = new THREE.Vector3((st.x + en.x) / 2, (st.y + en.y) / 2, (st.z + en.z) / 2)
        let originVector = new THREE.Vector3(0, cyheight / 2, 0)
        let targetVector = new THREE.Vector3(en.x - loc.x, en.y - loc.y, en.z - loc.z)
        // 求这两个向量共处平面的法向量，由originVector可知，法向量y轴分量为0
        let normalVector = new THREE.Vector3(targetVector.z, 0, -targetVector.x)
        // 法向量标准化
        let normalVectorLength = Math.sqrt(normalVector.x * normalVector.x + normalVector.y * normalVector.y + normalVector.z * normalVector.z)
        let axis = new THREE.Vector3(normalVector.x / normalVectorLength, normalVector.y / normalVectorLength, normalVector.z / normalVectorLength)
        // 计算旋转夹角
        let originVectorLength = Math.sqrt(originVector.x * originVector.x + originVector.y * originVector.y + originVector.z * originVector.z)
        let targetVectorLength = Math.sqrt(targetVector.x * targetVector.x + targetVector.y * targetVector.y + targetVector.z * targetVector.z) 
        let costheta = (originVector.x * targetVector.x + originVector.y * targetVector.y + originVector.z * targetVector.z) / originVectorLength / targetVectorLength
        let theta = Math.acos(costheta)
        cylinder.rotateOnAxis(axis, theta)
        cylinder.position.set(loc.x, loc.y, loc.z)

        // let plane = new THREE.PlaneGeometry(upRadius * 10, cyheight)
        // let m = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide})
        // let planemesh = new THREE.Mesh(plane, m)
        // planemesh.rotateOnAxis(axis, theta)
        // planemesh.position.set(loc.x, loc.y, loc.z)
        // scene.add(planemesh)
        // console.log(planemesh)

        // var rectLight = new THREE.RectAreaLight( 0xffff00, 50,  upRadius * 2, cyheight )
        // rectLight.rotateOnAxis(axis, theta)
        // rectLight.position.set(loc.x, loc.y, loc.z)
        // scene.add(rectLight)
        // rectLight.lookAt(hpoint.x, hpoint.y, hpoint.z)
        // var rectLight2 = new THREE.RectAreaLight( 0xffff00, 50,  upRadius * 2, cyheight )
        // rectLight2.rotateOnAxis(axis, theta)
        // rectLight2.position.set(loc.x, loc.y, loc.z)
        // scene.add(rectLight2)
        // rectLight2.lookAt(lpoint.x, lpoint.y, lpoint.z)

        // let plnum = cyheight / plsec
        // let xyzsec = new THREE.Vector3((en.x - st.x) / plnum, (en.y - st.y) / plnum, (en.z - st.z) / plnum)
        // for (let i = 0; i < plnum; i++) {
        //     var light = new THREE.PointLight( 0xff0000, 1, 100 )
        //     var pos = new THREE.Vector3(st.x + i * xyzsec.x, st.y + i * xyzsec.y, st.z + i * xyzsec.z)
        //     scene.add(light)
        //     light.position.set(pos.x, pos.y, pos.z)
        // }

        var alpha = new THREE.TextureLoader().load('./images/Textures/7.png')
        const lightSec = 0.1
        // 创建透明反光圆柱和顶点球
        for (let i = 0; i < 1 / lightSec; i++) {
            var wallObject = new THREE.CylinderGeometry( upRadius * (i * lightSec + 1), underRadius * (i * lightSec + 1), cyheight, segment );
            var wallMaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, transparent: true, alphaMap: alpha})
            var cylinderWall = new THREE.Mesh( wallObject, wallMaterial );
            scene.add( cylinderWall );
            cylinderWall.rotateOnAxis(axis, theta)
            cylinderWall.position.set(loc.x, loc.y, loc.z)
            var ballObject = new THREE.SphereGeometry( upRadius * (i * lightSec + 1), 32, 32 );
            var ballmaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, transparent: true, alphaMap: alpha})
            var ball = new THREE.Mesh( ballObject, ballmaterial );
            scene.add( ball );
            ball.position.set(st.x, st.y, st.z)
        }
    }
    let p1 = laln2xy(points[0][0], points[0][1], 5)
    let p2 = laln2xy(points[2][0], points[2][1], 5)
    let p3 = laln2xy((points[0][0] + points[2][0]) / 2, (points[0][1] + points[2][1]) / 2, 50)
    let d = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z))
    let loc = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2)
    rectLight = new THREE.RectAreaLight( 0xffff00, 50, d * 1.5, d * 1.5 )
    rectLight.position.set( loc.x, loc.y, loc.z );
    rectLight.lookAt( p3.x, p3.y, p3.z );
    scene.add( rectLight )
    console.log('rect', rectLight)
}

function jingtaiqiang(p, param) {
    let height = 50
    var points = []
    for (let i = 0; i < p.length; i++) {
        points.push(p[i])
    }
    var r = 0.0005
    const type = 1
    var lightlist = []
    // if (type === 1) {
    //     for (let i = 0; i < points.length - 1; i++) {
    //         var rec = createRecFromLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], r)
    //         var vl = createPLFromRec(rec, r)
    //         lightlist.push(vl)
    //         var wall = createWall(height, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
    //         param.scene.add(wall)
    //     }
    //     allpl = addLight(lightlist[0], lightlist[1], lightlist[2], lightlist[3], param.scene)
    // }
    // else addPoints(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1], height, param.scene)
    createCylinder(points, param.scene)
    // addFog(param.scene)
}

export {
    jingtaiqiang, createLightMateria, laln2xy, randomPoints, addPoint, shootPoint, lizi, dir, allpl, rectLight
}