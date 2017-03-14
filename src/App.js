import React, { Component } from 'react'
import * as THREE from 'three'
import key from 'keymaster'
var OrbitControls = require('three-orbit-controls')(THREE)
import Shape from 'clipper-js'
import {Clipper} from 'clipsy'
import { GUI } from 'dat-gui'
import _ from 'lodash'

const rev = (mm) => (mm*25.0)
const normalize = (mm) => (mm/25.0)
const mm = normalize

const EDGES_COLOR = 0xbbbbbb;

const ballGeometry = new THREE.SphereGeometry(mm(120), 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

const plywoodMaterial = new THREE.MeshPhongMaterial({color: 0xD5D3BC, shininess: 0});
const barMaterial = new THREE.MeshPhongMaterial({color: 0xB4B4B2, shininess: 0});

let spec = {
  showEdges: false,
  width: 3900,
  frames: 10,
  roof: {
    apex: 3900
  },
  leftWall: {
    height: 2400
  },
  rightWall: {
    height: 2400
  },
  beams: {
    width: 74,
    height: 200,
  },
  totals: {
  }
}
let previousSpec, newSpec;

const showAxes = (object, length=30) => {
  drawArrow([1,0,0], 0XFF0000, object, length)
  drawArrow([0,1,0], 0X00FF00, object, length)
  drawArrow([0,0,1], 0X0000FF, object, length)
}

const drawArrow = (direction, color, parent, length) => {
  const dir = new THREE.Vector3( ...direction );
  dir.normalize();
  const origin = new THREE.Vector3();
  var arrowHelper = new THREE.ArrowHelper( dir, origin, length, color );
  parent.add(arrowHelper)
}

const setVal = (id, val, format=true) => {
  val = (format ? val.toFixed(2) : val)
  document.getElementById(id).innerHTML = val
}

class App extends Component {

  constructor(props) {
    super(props)
    this.camera = undefined;
    this.renderer = undefined;
    this.mouse = new THREE.Vector2()
    this.plane = new THREE.Plane()
    this.intersection = new THREE.Vector3()
    this.raycaster = new THREE.Raycaster()
    this.selectedBall = null;
    this.balls = []
    this.mouseDown = false
    this.onWindowResize = this.onWindowResize.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.wikihouse = this.wikihouse.bind(this)
    this.animate = this.animate.bind(this)
    this.updateWikiHouse = this.updateWikiHouse.bind(this)
    this.renderWikiHouse = _.debounce(this.renderWikiHouse.bind(this), 10)
    // this.renderWikiHouse = this.renderWikiHouse.bind(this)
  }

  componentDidMount() {
    const VIEW_ANGLE = 75;
    const ASPECT =  window.innerWidth / window.innerHeight;
    const NEAR = 0.1;
    const FAR = 10000;

    // SET UP RENDERER
    const container = document.querySelector('#container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();

    // SET UP CAMERA
    this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR )
    this.camera.position.y = 220;
    this.camera.position.x = -50;
    this.camera.position.z = -200;
    this.camera.lookAt(new THREE.Vector3(0,mm(1500),0))

    // SET UP CAMERA CONTROLS
    this.controls = new OrbitControls(this.camera)
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.maxDistance = mm(20000);
    this.controls.minDistance = mm(1000);
    this.controls.enableZoom = true;
    this.scene.background = new THREE.Color(0xF6F6F6);

    //  ADD LIGHTING
    const ambientLight = new THREE.AmbientLight(0xF6F6F6)
    ambientLight.intensity = 0.3;
    this.scene.add(ambientLight);

    const mainLight = new THREE.HemisphereLight(0xFFFFFF, 0xEBEBD8, 0.7);
    this.scene.add(mainLight);

    const pointLight = new THREE.PointLight(0xCFCCB4, 0.5, 0, 1);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.bias = 1;
    pointLight.position.x = 90;
    pointLight.position.y = 500;
    pointLight.position.z = -300;
    this.scene.add(pointLight);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 50);
    // this.scene.add(pointLightHelper);

    // ADD GROUND
    const groundMaterial = new THREE.ShadowMaterial();
    groundMaterial.opacity = 0.2
    const groundGeometry = new THREE.PlaneGeometry(800,800);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = -mm(200-36);
    ground.rotation.x = -Math.PI/2;
    this.scene.add(ground);
    // const gridMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE, wireframe: true });
    // const gridGeometry = new THREE.PlaneGeometry(1600,1600,30,30);
    // let grid = new THREE.Mesh(gridGeometry, gridMaterial);
    // grid.receiveShadow = false;
    // grid.position.y = ground.position.y-1;
    // grid.rotation.x = -Math.PI/2;
    // scene.add(grid);

    // SET UP EVENT LISTENERS
    window.addEventListener( 'resize', this.onWindowResize, false )
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false )
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false )
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false )
    this.onWindowResize()

    // SET UP DEBUG MENU
    let gui = new GUI()
    gui.add(spec, 'width', 2200, 4600).step(100).listen().onChange(this.updateWikiHouse)
    gui.add(spec.roof, 'apex', 2800, 4600).step(100).listen().onChange(this.updateWikiHouse)
    gui.add(spec, 'frames', 4, 14).step(1).listen().onChange(this.updateWikiHouse)
    gui.add(spec, 'showEdges').onChange(this.updateWikiHouse)

    // ADD BALLS!
    //
    const heightBall = new THREE.Mesh(ballGeometry, ballMaterial)
    heightBall.name = 'y'
    drawArrow([0,1,0], 0X00FF00, heightBall, 40)
    this.scene.add(heightBall)
    //
    const lengthBall = new THREE.Mesh(ballGeometry, ballMaterial)
    lengthBall.name = 'z'
    drawArrow([0,0,-1], 0X0000FF, lengthBall, 40)
    this.scene.add(lengthBall)
    //
    const widthBall = new THREE.Mesh(ballGeometry, ballMaterial)
    widthBall.name = 'x'
    drawArrow([-1,0,0], 0XFF0000, widthBall, 40)
    this.scene.add(widthBall)
    //
    this.balls = [heightBall, lengthBall, widthBall]

    // ADD WIKIHOUSE
    this.updateWikiHouse()

    // INITIALIZE SCENE
    this.animate()

  }

  renderWikiHouse() {
    newSpec = JSON.stringify(spec)
    if (previousSpec !== newSpec) {
      previousSpec = newSpec
      if (window.microhouse) { this.scene.remove(window.microhouse) }
      window.microhouse = this.wikihouse();
      this.scene.add(window.microhouse);
    }
  }

  updateWikiHouse(e) {
    this.renderWikiHouse()
    this.balls[0].position.y = mm(spec.roof.apex)
    this.balls[0].position.z = mm(600)
    this.balls[1].position.y = mm(120)
    this.balls[2].position.x = -mm(spec.width/2)
    this.balls[2].position.y = mm(spec.leftWall.height/2)
    this.balls[2].position.z = mm(600)
  }

  animate() {
    this.renderer.render(this.scene, this.camera)
    this.controls.update()
    requestAnimationFrame(this.animate)
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth/window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth,window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX/this.renderer.domElement.width)*2 - 1
    this.mouse.y = -(event.clientY/this.renderer.domElement.height)*2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    let intersects = this.raycaster.intersectObjects(this.balls)

    if (!this.mouseDown) {
      if (intersects.length > 0) {
        this.selectedBall = intersects[0].object
      } else {
        this.selectedBall = null
      }
    }

    if (this.selectedBall) {
      if (this.mouseDown) {
        this.renderer.domElement.style.cursor = '-webkit-grabbing'
        this.controls.enabled = false
        this.plane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(this.plane.normal),
          this.selectedBall.position)

        if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
          this.selectedBall.position[this.selectedBall.name] = this.intersection[this.selectedBall.name]
          switch(this.selectedBall.name) {
            case "x":
              spec.width = Math.round(Math.max(Math.min(-(this.selectedBall.position.x * 25.0) * 2, 4600), 2000) / 100) * 100
              break;
            case "y":
              spec.roof.apex = Math.round(Math.max(Math.min((this.selectedBall.position.y * 25.0), 4600), 2800) / 100) * 100
              break;
          }
          this.updateWikiHouse()
        }
      } else {
        this.renderer.domElement.style.cursor = '-webkit-grab'
      }
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }

  onMouseDown(event) {
    this.mouseDown = true
    if (this.selectedBall) {
      this.renderer.domElement.style.cursor = '-webkit-grabbing'
    }
  }

  onMouseUp(event) {
    this.mouseDown = false
    this.selectedBall = null
    this.controls.enabled = true
    this.renderer.domElement.style.cursor = '-webkit-grab'
  }

  render() {
    return (
      <div id="container" className="App"></div>
    )
  }

  wikihouse() {
    let MicroHouse = new THREE.Object3D();

    spec.length = (spec.frames-1) * 1200;
    spec.floorArea = ((spec.width - 500) * spec.length);
    const opposite = spec.roof.apex-spec.leftWall.height;
    const adjacent = spec.width/2;
    spec.roof.length = Math.hypot(adjacent, opposite);
    spec.roofArea = spec.roof.length * spec.length * 2;

    spec.roof.angle = Math.PI/2 - Math.atan(opposite/adjacent);
    const outerPoints = [
      [0, spec.roof.apex],
      [spec.width/2, spec.rightWall.height],
      [spec.width/2, 0],

        [spec.width/2-84, 0, true],
        [spec.width/2-84, 36, true],
        [spec.width/2-84-74, 36, true],
        [spec.width/2-84-74, 0, true],

        [-spec.width/2+84+74, 0, true],
        [-spec.width/2+84+74, 36, true],
        [-spec.width/2+84, 36, true],
        [-spec.width/2+84, 0, true],

      [-spec.width/2, 0],
      [-spec.width/2, spec.leftWall.height],
    ]
    var outerFramePoints = outerPoints.map(p => new THREE.Vector2(mm(p[0]), mm(p[1])))
    var frameShape = new THREE.Shape(outerFramePoints)

    var paths = [outerPoints.filter(p => !p[2]).map(p => ({X: p[0], Y: p[1]}))]

    const subject = new Shape(paths, true)
    spec.innerPoints = subject.offset(-250, {
      jointType: 'jtMiter',
      endType: 'etClosedPolygon',
      miterLimit: 2,
      roundPrecision: 0
    }).paths[0].map(p => new THREE.Vector2(mm(p.X), mm(p.Y)))

    const innerOpposite = spec.innerPoints[1].y-spec.innerPoints[2].y
    const innerAdjacent = spec.innerPoints[2].x
    spec.roof.innerLength = rev(Math.hypot(innerAdjacent, innerOpposite))
    spec.innerHeight = rev(spec.innerPoints[2].y - spec.innerPoints[3].y)
    spec.innerFullHeight = rev(spec.innerPoints[1].y - spec.innerPoints[3].y)
    spec.innerWidth = rev(spec.innerPoints[4].x - spec.innerPoints[3].x)

    spec.outerFrameArea = (spec.width * spec.leftWall.height) + ((spec.roof.apex - spec.leftWall.height) * spec.width)/2;
    spec.innerFrameArea = (spec.innerWidth * spec.innerHeight) + ((spec.innerFullHeight - spec.innerHeight) * spec.innerWidth)/2;


    spec.internalVolume = spec.innerFrameArea * spec.length

    spec.frameArea = spec.outerFrameArea - spec.innerFrameArea
    spec.frameVolume = spec.frameArea * spec.length

    spec.insulationVolume = spec.frameVolume// - spec.internalVolume

    spec.wallsArea = (spec.length * spec.leftWall.height) * 2

    var hole = new THREE.Path();
    hole.fromPoints(spec.innerPoints);
    frameShape.holes = [hole];

    var frameGeometry = new THREE.ExtrudeGeometry(frameShape, { steps: 2, amount: mm(150), bevelEnabled: false });

    var frame, distance = mm(1200);
    for (var i = 0; i < spec.frames; i++) {
      frame = new THREE.Mesh(frameGeometry, plywoodMaterial);
      frame.position.z = (i * distance);// -(total/2 * distance);
      frame.position.y = 0;
      frame.receiveShadow = true;
      frame.castShadow = true;
      MicroHouse.add(frame);

      if (spec.showEdges) {
        var helper = new THREE.EdgesHelper( frame, EDGES_COLOR );
        helper.position.z = frame.position.z;
        helper.matrixAutoUpdate = true;
        helper.material.linewidth = 2;
        MicroHouse.add(helper);
      }
    }

    var components = [
      ['bar', {
          position: [-mm(spec.width/2 - 84), -mm(200-36), 0],
          shape: [
            [0,0],
            [mm(74), 0],
            [mm(74), mm(200)],
            [0, mm(200)]
          ],
          depth: mm(4800),
          rotation: {
            x: 0,
            y: 0,
            z: 0
          },
          material: barMaterial
        }
      ],

      ['bar', {
          position: [mm(spec.width/2 - 84 - 74), -mm(200-36), 0],
          shape: [
            [0,0],
            [mm(74), 0],
            [mm(74), mm(200)],
            [0, mm(200)]
          ],
          depth: mm(4800),
          rotation: {
            x: 0,
            y: 0,
            z: 0
          },
          material: barMaterial
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle - Math.PI,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75+1205)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle - Math.PI,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75 + 1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle,
            y: -Math.PI/2,
            z: - Math.PI
          }
        }
      ],

      ['roof', {
          position: [0, mm(spec.roof.apex), mm(75 + 2405)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.length)],
            [0, mm(spec.roof.length)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle,
            y: -Math.PI/2,
            z: - Math.PI
          }
        }
      ],

      ['innerRoof', {
          position: [mm(spec.width/2-250), spec.innerPoints[2].y, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.innerLength - 40)],
            [0, mm(spec.roof.innerLength - 40)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerRoof', {
          position: [-mm(spec.width/2-250), spec.innerPoints[2].y, mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.roof.innerLength)],
            [0, mm(spec.roof.innerLength)]
          ],
          depth: mm(40),
          rotation: {
            x: spec.roof.angle - Math.PI,
            y: -Math.PI/2,
            z: - Math.PI
          }
        }
      ],

      ['floor', {
          position: [-mm(spec.width/2-250), mm(250), mm(75)],
          shape: [
            [0,0],
              [mm(75),0],
              [mm(75),-mm(250)],
              [mm(1200-75),-mm(250)],
              [mm(1200-75),0],
            [mm(1200), 0],
            [mm(1200), mm(spec.width-500)],
            [0, mm(spec.width-500)]
          ],
          depth: mm(40),
          rotation: {
            x: -Math.PI/2,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['outerWall', {
          position: [mm(spec.width/2+40), 0, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.leftWall.height)],
            [0, mm(spec.leftWall.height)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['outerWall', {
          position: [-mm(spec.width/2), 0, mm(75)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.leftWall.height)],
            [0, mm(spec.leftWall.height)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: -Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerWall', {
          position: [-mm(spec.width/2-250), mm(250+40), mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.innerHeight - 80)],
            [0, mm(spec.innerHeight - 80)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: Math.PI/2,
            z: 0
          }
        }
      ],

      ['innerWall', {
          position: [mm(spec.width/2-250-40), mm(250+40), mm(75+1200)],
          shape: [
            [0,0],
            [mm(1200), 0],
            [mm(1200), mm(spec.innerHeight - 80)],
            [0, mm(spec.innerHeight - 80)]
          ],
          depth: mm(40),
          rotation: {
            x: 0,
            y: Math.PI/2,
            z: 0
          }
        }
      ]

    ]

    components.forEach(component => {
      const name = component[0]
      const { position, shape, depth, vector, rotation } = component[1]
      let vectorPosition = new THREE.Vector3(...position)
      let points = shape.map(xy => new THREE.Vector2(xy[0], xy[1]))
      let pointsShape = new THREE.Shape(points)
      let material = component[1].material || plywoodMaterial

      let geom = new THREE.ExtrudeGeometry(pointsShape, { steps: 1, amount: depth, bevelEnabled: false })
      let mesh = new THREE.Mesh(geom, material)

      window[name] = window[name] || []
      window[name].push(mesh)

      let parent = new THREE.Object3D();
      // showAxes(parent, 30)

      parent.position.copy(vectorPosition);

      parent.rotation.order = 'YZX';
      parent.rotation.x = rotation.x;
      parent.rotation.y = rotation.y;
      parent.rotation.z = rotation.z;

      parent.add(mesh);
      MicroHouse.add(parent);

      mesh.receiveShadow = true;
      mesh.castShadow = true;

      if (spec.showEdges) {
        var eg = new THREE.EdgesGeometry( mesh.geometry );
        var em = new THREE.LineBasicMaterial( { color: EDGES_COLOR, linewidth: 1 } );
        var es = new THREE.LineSegments( eg, em );
        mesh.add( es );
        MicroHouse.add(helper);
      }
    })
    // showAxes(scene, 40);

    var box = new THREE.Box3().setFromObject(MicroHouse)

    setVal('width', spec.width/1000)
    setVal('height', spec.roof.apex/1000)
    setVal('length', spec.length/1000)

    setVal('floor-area', spec.floorArea/1000000)
    setVal('roof-area', spec.roofArea/1000000)
    setVal('walls-area', spec.wallsArea/1000000)


    // setVal('internal-volume', spec.innerFrameArea)

    spec.footprint = (spec.width * spec.length)/1000000
    setVal('footprint', spec.footprint)

    spec.insulationVolume = spec.insulationVolume/1000000000
    setVal('insulation-volume', spec.insulationVolume)
    spec.insulationCost = spec.insulationVolume * 25.0
    setVal('insulation-cost', spec.insulationCost)

    setVal('internal-volume', spec.internalVolume/1000000000)

    spec.plywoodSheets = 200
    spec.plywoodCost = 22.30 * spec.plywoodSheets
    spec.plywoodManufactureCost = 25.00 * spec.plywoodSheets
    spec.plywoodTotal = spec.plywoodCost + spec.plywoodManufactureCost

    setVal('plywood-sheets', spec.plywoodSheets, false)
    setVal('plywood-cost', spec.plywoodCost)
    setVal('plywood-manufacture-cost', spec.plywoodManufactureCost)
    setVal('plywood-total', spec.plywoodTotal)

    setVal('total-cost', (spec.plywoodTotal + spec.insulationCost).toFixed(2).toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1,'), false)

    return MicroHouse;
  }
}

export default App
