import React, { Component } from 'react'
import * as THREE from 'three'
var OrbitControls = require('three-orbit-controls')(THREE)

class App extends Component {

  componentDidMount() {

    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    // Set some camera attributes.
    const VIEW_ANGLE = 75;
    const ASPECT = WIDTH / HEIGHT;
    const NEAR = 0.1;
    const FAR = 10000;

    // Get the DOM element to attach to
    const container = document.querySelector('#container');
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    // renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.enabled = true
    renderer.setSize(WIDTH, HEIGHT);
    // renderer.shadowMapSoft = false;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR )
    camera.position.y = 300;
    camera.position.x = -120;
    camera.position.z = -200;
    scene.add(camera);

    const controls = new OrbitControls(camera)
    controls.minPolarAngle = 0// Math.PI/6
    controls.maxPolarAngle = Math.PI / 2.1
    controls.maxDistance = 600
    controls.minDistance = 250
    controls.target.set(0, 20, 0)
    controls.enableZoom = true

    scene.background = new THREE.Color(0xF6F6F6);

    container.appendChild(renderer.domElement);

    const groundMaterial = new THREE.ShadowMaterial();
    groundMaterial.opacity = 0.2
    const groundGeometry = new THREE.PlaneGeometry(800,800);
    let ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    ground.position.y = 0; //lower it
    ground.rotation.x = -Math.PI/2; //-90 degrees around the xaxis
    // ground.doubleSided = true;
    scene.add(ground);


    const ambientLight = new THREE.AmbientLight(0xCFCCB4)
    ambientLight.intensity = 1;
    // ambientLight.castShadow = true;
    scene.add(ambientLight);


    // // create a point light
    const insideLight = new THREE.HemisphereLight(0xFFFFFF, 0xF2F2DE, 0.1);
    scene.add(insideLight);

    // create a point light
    const pointLight = new THREE.PointLight(0xF2F2DE, 0.4, 0, 1);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 50);
    // scene.add(pointLightHelper);
    pointLight.castShadow = true;
    // pointLight.shadowCameraVisible = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.position.x = 90;
    pointLight.position.y = 500;
    pointLight.position.z = -300;
    scene.add(pointLight);




    // create the sphere's material
    const plywoodMaterial = new THREE.MeshLambertMaterial({color: 0xD5D3BC});


    var outerFramePoints = [];
    outerFramePoints.push( new THREE.Vector2 (0, 180) );
    outerFramePoints.push( new THREE.Vector2 (100, 100) );
    outerFramePoints.push( new THREE.Vector2 (100, 0) );
    outerFramePoints.push( new THREE.Vector2 (-100, 0) );
    outerFramePoints.push( new THREE.Vector2 (-100, 100) );
    var frameShape = new THREE.Shape(outerFramePoints);

    var innerFramePoints = [];
    innerFramePoints.push( new THREE.Vector2 (0, 170) );
    innerFramePoints.push( new THREE.Vector2 (-90, 100) );
    innerFramePoints.push( new THREE.Vector2 (-90, 10) );
    innerFramePoints.push( new THREE.Vector2 (90, 10) );
    innerFramePoints.push( new THREE.Vector2 (90, 100) );
    var hole = new THREE.Path();
    hole.fromPoints(innerFramePoints);
    frameShape.holes = [hole];

    var frameGeometry = new THREE.ExtrudeGeometry( frameShape, { steps: 2, amount: 5, bevelEnabled: false } );

    var frame,
      total = 8,
      distance = 40;
    for (var i = 0; i < total; i++) {
      frame = new THREE.Mesh( frameGeometry, plywoodMaterial );
      frame.position.z = (i * distance - (total/2 * distance));
      frame.position.y = 0;
      frame.receiveShadow = true;
      frame.castShadow = true;
      scene.add(frame);

      var helper =new THREE.EdgesHelper( frame, 0x000000 );
      helper.position.z = frame.position.z;
      helper.matrixAutoUpdate = true;
      helper.material.linewidth = 2;
      scene.add(helper);
    }

    var components = [
      ['topBeam', [[-1.5, 177], [1.5, 177], [1.5, 170], [-1.5, 170]]],
      ['topLeftBeam', [[-97, 100], [-90, 100], [-90, 98], [-97, 98]]],
      ['topRightBeam', [[97, 100], [90, 100], [90, 98], [97, 98]]],

      ['floor', [[90, 12], [90, 10], [-90, 10], [-90, 12]]],

      ['leftInnerWall', [[89, 100], [89, 12], [89.5, 12], [89.5, 100]]], // 0.435
      ['rightInnerWall', [[-88, 100], [-88, 12], [-90, 12], [-90, 100]], 0.435], //

      ['leftCeiling', [[0, 170], [-90, 100], [-100, 100], [0, 180]]], // 0.435

      ['rightCeiling1', [[0, 168], [88, 100], [90, 100], [0, 170]], 0.315], // 0.435
      ['rightCeiling2', [[0, 168], [88, 100], [90, 100], [0, 170]], 0.435, 0.535], // 0.435

      ['backWall', [[0, 180], [100, 100], [100, 12], [-100, 12], [-100, 100]], 0.02, 116], // 0.435

      ['frontWall', [[0, 180], [100, 100], [100, 0], [50, 0], [50, 100], [-50, 100], [-50, 0], [-100, 0], [-100, 100]], 0.03], // 0.435

      // ['insideDivider', [[0, 180], [100, 100], [100, 0], [50, 0], [50, 100], [-50, 100], [-50, 0], [-100, 0], [-100, 100]], 0.01, -40], //

    ]

    for (var i = 0; i < 10; i++) {
      var startingPoint = (20*i) - 90
      components.push([`bottomSlats${i}`, [[startingPoint+1.5, 7], [startingPoint+1.5, 0], [startingPoint-1.5, 0], [startingPoint-1.5, 7]]],)
    }

    components.forEach(beam => {
      let name = beam[0]
      let points = beam[1].map(points => new THREE.Vector2(...points) )
      let shape = new THREE.Shape(points)
      let geom = new THREE.ExtrudeGeometry(shape, { steps: 2, amount: (total-1) * distance * (beam[2] || 1), bevelEnabled: false })
      let mesh = new THREE.Mesh(geom, plywoodMaterial)
      mesh.position.z = (beam[3] || -(total/2 * distance));
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);

      var helper =new THREE.EdgesHelper( mesh, 0x000000 );
      helper.position.z = mesh.position.z;
      helper.matrixAutoUpdate = true;
      helper.material.linewidth = 2;
      scene.add(helper);
    })

    controls.update()


    function update () {
      renderer.render(scene, camera);
      requestAnimationFrame(update);
    }

    update()
  }
  render() {
    return (
      <div id="container" className="App"></div>
    )
  }
}

export default App
