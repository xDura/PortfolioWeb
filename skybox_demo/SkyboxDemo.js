var MainFrame = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    controls: null,
    clock: null,
    stats: null,

    init: function() {
		//init all Treejs stuff

        //create main scene
        this.scene = new THREE.Scene();

        var SCREEN_WIDTH = window.innerWidth,
            SCREEN_HEIGHT = window.innerHeight;

        //camera
        var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 1, FAR = 15000;
        this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
        this.scene.add(this.camera);
        this.camera.position.set(0, 0, 30);
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        //renderer
        this.renderer = new THREE.WebGLRenderer({antialias:true, alpha: false});
        this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.renderer.setClearColor(0x000000, 1);

        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;

        //container
        this.container = document.createElement('div');
        document.body.appendChild(this.container);
        this.container.appendChild(this.renderer.domElement);

        //events
        THREEx.WindowResize(this.renderer, this.camera);

        //OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target = new THREE.Vector3(0, 0, 0);
        this.controls.maxDistance = 700;

        //clock
        this.clock = new THREE.Clock();

        //stats
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '50px';
        this.stats.domElement.style.bottom = '50px';
        this.stats.domElement.style.zIndex = 1;
        this.container.appendChild( this.stats.domElement );

        //add point light
        var spLight = new THREE.PointLight(0xffffff, 1.75, 1000);
        spLight.position.set(0, 0, 0);
        this.scene.add(spLight);
		
    },
	
	addSkybox: function() {
	
		//define paths
		var path = "src/Skybox2/";
		var sides = [ 'Skybox2RT.jpg', 'Skybox2LF.jpg', 'Skybox2UP.jpg', 
							'Skybox2DN.jpg', 'Skybox2FT.jpg', 'Skybox2BK.jpg'];

		//load textures
		var materialArray = [];
			for (var i = 0; i < 6; i++)
				materialArray.push( new THREE.MeshBasicMaterial({
				map: THREE.ImageUtils.loadTexture( path + sides[i] ),
				side: THREE.BackSide
				}));
				
		var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
		skyMaterial.needsUpdate = true;
		//cube geometry mesh
		var skyBox = new THREE.Mesh(new THREE.BoxGeometry(8000, 8000, 8000), skyMaterial);
		skyBox.position.x = 0;
		skyBox.position.y = 0;
		skyBox.position.z = 0;

		this.scene.add(skyBox);
	}
};

//Loop
function animate() {
    requestAnimationFrame(animate);
    render();
    update();
}

//Update
function update() {
    MainFrame.controls.update(MainFrame.clock.getDelta());
    MainFrame.stats.update();
}

//Render
function render() {
    if (MainFrame.renderer) {
        MainFrame.renderer.render(MainFrame.scene, MainFrame.camera);
    }
}

//Initialize App
function initDemo() {
    MainFrame.init();
	MainFrame.addSkybox();
    animate();
}

if (window.addEventListener)
    window.addEventListener('load', initDemo, false);
else if (window.attachEvent)
    window.attachEvent('onload', initDemo);
else window.onload = initDemo;