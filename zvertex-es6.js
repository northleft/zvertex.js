
(function(){
  var ZV = {all: {}};
	window.ZV = ZV;
	
  var zvid = -1;
  function ZVID(){
    zvid++;
    return 'ZF_' + zvid;
  }
  
  var ZVMath = Math;
  var ZVsin = ZVMath.sin;
  var ZVcos = ZVMath.cos;
  var ZVtan = ZVMath.tan;

  
  if (window.FTrig){
    ZVMath = new FTrig(FTrig.LOW);
    ZVsin = ZVMath.sin;
    ZVcos = ZVMath.cos;
    ZVtan = function(x){
      return ZVsin(x) / ZVcos(x);
    }
  }

  class basic{
    constructor(){
      this.ZVID = ZVID();
      ZV.all[this.ZVID] = this;
    }
  }

  class space extends basic{
    constructor(x, y, z){
      super();
      this.position(x, y, z);
      
      this.children = [];
      this.hasChildren = false;
      this.transforms = [];
      this.hasTransforms = false;
      this.matrix = matrixNew();
      this.childMatrix = matrixNew();
      this.sortChildren = true;

      this.rendered = {
        x: this.x,
        y: this.y,
        z: this.z
      }

      this.transformed = {
        x: this.x,
        y: this.y,
        z: this.z
      }
    }

    position(x, y, z){
      this.x = x || this.x || 0;
      this.y = y || this.y || 0;
      this.z = z || this.z || 0;
    }
    
    addChild(obj){
      if (obj.ZVID){
        obj.parent = this;
        obj.world = this.world;
        this.children.push(obj);
        this.hasChildren = true;
      }
    }

		addTransform(obj){
      if (obj.ZVID){
			  this.transforms.push(obj);
        this.hasTransforms = true;
      }
		}
    
    renderChildren(){
      let children = this.children;
      let len = children.length;
      let i;

      i = len;
      while (i--){
        
      }
      
      i = len;
      while (i--){
        children[i].render();
      }
    }
  }

  class World extends space{
    constructor(width, height, x, y, z, focal){
      super(x, y, z);
      
      this.width = width;
      this.height = height;
      this.focal = focal || 1000;
      this.world = this;
      this.parent = false;
      this.camera = {};
      this.range = {};
    }

    render(){
      this.camera = {
        x: this.x,
        y: this.y,
        z: this.z - this.focal
      }
      this.range = {
        zmin: 9999999,
        zmax: -9999999,
        xmin: 9999999,
        xmax: -9999999,
        ymin: 9999999,
        ymax: -9999999
      }

      let mat = matrixNew();
      let transforms = this.transforms;

      let i;
      let len = transforms.length;
      for (i = 0; i < len; i++){
        mat = matrixMultiply(mat, transforms[i].render());
      }

      this.matrix = mat;
      this.renderChildren();
    }
  }

  class Point extends space{
    constructor(x, y, z){
      super(x, y, z);

      this.transforms = [];
      this.hasTransforms = false;
      this.visible = true;
      this.world = false;
      this.cameraDistance = 0;
    }

    render(){
      let
        parent = this.parent,
        world = this.world,
        transforms = this.transforms,
        matrix = parent.matrix ? parent.matrix : matrixNew(),
        childMatrix = matrix,
        i, j,
        mixMatrix = true;

        // need sorting feature
      ;

      i = transforms.length;
      j = i;

      while(i--){
        t = transforms[j - i];
        let m = t.render();
        let ats = !t.applyToSelf;
        let atc = !t.applyToChildren;

        if (!mixMatrix || ats || atc){
          mixMatrix = false;

          if (ats){
            matrix = matrixMultiply(matrix, m);
          }
          if (atc){
            childMatrix = matrixMultiply(childMatrix, m);
          }
        } else {
          matrix = matrixMultiply(matrix, m);
        }
      }

      if (mixMatrix){
        this.childMatrix = matrix.slice(0);
      }
      
      let ox = this.x;
      let oy = this.y;
      let oz = this.z;

      let m0 = matrix[0];
      let m1 = matrix[1];
      let m2 = matrix[2];

      let nx = m0[0] * ox + m0[1] * oy + m0[2] * oz + m0[3];
      let	ny = m1[0] * ox + m1[1] * oy + m1[2] * oz + m1[3];
      let nz = m2[0] * ox + m2[1] * oy + m2[2] * oz + m2[3];
      
      let parentTransformed = parent.transformed;
      nx += parentTransformed.x;
      ny += parentTransformed.y;
      nz += parentTransformed.z;

      let transformed = this.transformed
      transformed.x = nx;
      transformed.y = ny;
      transformed.z = nz;

      let focal = world.focal;
      let scale = focal ? focal / (focal + world.z + nz) : 1;

      let rendered = this.rendered;
      rendered.x = nx * scale;
      rendered.y = ny * scale;
      rendered.z = nz;
      rendered.scale = scale;

      let camera = world.camera;

      this.cameraDistance = Math.sqrt(Math.pow(camera.x - rendered.x, 2) + Math.pow(camera.y - rendered.y, 2) + Math.pow(camera.z - rendered.z, 2));

      let range = world.range;
      range.xmin = Math.min(range.xmin, rendered.x);
      range.xmax = Math.max(range.xmax, rendered.x);
      range.ymin = Math.min(range.ymin, rendered.y);
      range.ymax = Math.max(range.ymax, rendered.y);
      range.zmin = Math.min(range.zmin, rendered.z);
      range.zmax = Math.max(range.zmax, rendered.z);
      
      this.renderChildren();
    }
  }

  class Transform extends basic{
    constructor(){
      super();
      this.applyToChildren = true;
      this.applyToSelf = true;
      this.matrix = matrixNew();
    }
  }

  class Translate extends Transform{
    constructor(x, y, z){
      super();
      this.x = this.y = this.z = 0;
    }

    render(){
			var m = [
				[1, 0, 0, this.x],
				[0, 1, 0, this.y],
				[0, 0, 1, this.z],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
		};

    val(x, y, z){
      if (arguments.length == 1){
        y = x;
        z = x;
      }
      this.x = x || this.x;
      this.y = y || this.y;
      this.z = z || this.z;
    }
  }

  class Scale extends Transform{
    constructor(x, y, z){
      super();
      this.val(x, y, z);
    }

    render(){
      let m = [
        [this.x, 0, 0, 0],
        [0, this.y, 0, 0],
        [0, 0, this.z, 0],
        [0, 0, 0, 1]
      ];
      this.matrix = m;
      
      return m;
    }

    val(x, y, z){
      if (arguments.length == 1){
        y = x;
        z = x;
      }

      this.x = x || this.x;
      this.y = y || this.y;
      this.z = z || this.z;
    }
  }

  class RotateX extends Transform{
    constructor(v){
      super();
      this.x = v || 0;
    }

    render(){
      let rad = this.x;
			let c = ZVcos(rad);
			let s = ZVsin(rad);
			
			let m = [
				[1, 0, 0, 0],
				[0, c, -s, 0],
				[0, s, c, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(v){
      this.x = v;
    }
  }

  class RotateY extends Transform{
    constructor(v){
      super();
      this.val(v);
    }

    render(){
      let rad = this.y;
			let c = ZVcos(rad);
			let s = ZVsin(rad);
			
			let m = [
				[c, 0, s, 0],
				[0, 1, 0, 0],
				[-s, 0, c, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(v){
      this.y = v || 0;
    }
  }

  class RotateZ extends Transform{
    constructor(v){
      super();
      this.z = v || 0;
    }

    render(){
      let rad = this.z;
			let c = ZVcos(rad);
			let s = ZVsin(rad);
			
			let m = [
				[c, -s, 0, 0],
				[s, c, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(v){
      this.z = v;
    }
  }

  class Skew extends Transform{
    constructor(xy, xz, yx, yz, zx, zy){
      super();
      this.xy = xy || 0;
      this.xz = xz || 0;
      this.yx = yx || 0;
      this.yz = yz || 0;
      this.zx = zx || 0;
      this.zy = zy || 0;
    }

    render(){
      let xy = ZVtan(this.xy);
      let xz = ZVtan(this.xz);
      let yx = ZVtan(this.yx);
      let yz = ZVtan(this.yz);
      let zx = ZVtan(this.zx);
      let zy = ZVtan(this.zy);
      
      let m = [
        [1, xy, xz, 0],
        [yx, 1, yz, 0],
        [zx, zy, 1, 0],
        [0, 0, 0, 1]
      ];
      
      this.matrix = m;
      return m;
    }

    val(xy, xz, yx, yz, zx, zy){
      this.xy = xy || this.xy;
      this.xz = xz || this.xz;
      this.yx = yx || this.yx;
      this.yz = yz || this.yz;
      this.zx = zx || this.zx;
      this.zy = zy || this.zy;
    }
  }

  class SkewX extends Transform{
    constructor(y, z){
      super();
      this.y = y || 0;
      this.z = z || 0;
    }

    render(){
      let y = ZVtan(this.y);
			let z = ZVtan(this.z);
			
			let m = [
				[1, y, z, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(y, z){
      if (arguments.length == 1){
        z = y;
      }

      this.y = y || this.y;
      this.z = z || this.z;
    }
  }

  class SkewY extends Transform{
    constructor(x, z){
      super();
      this.x = x || 0;
      this.z = z || 0;
    }

    render(){
      let x = ZVtan(this.x);
			let z = ZVtan(this.z);
			
			let m = [
				[1, 0, 0, 0],
				[x, 1, z, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(x, z){
      if (arguments.length == 1){
        z = x;
      }

      this.x = x || this.x;
      this.z = z || this.z;
    }
  }

  class SkewZ extends Transform{
    constructor(x, y){
      super();
      this.x = x || 0;
      this.y = y || 0;
    }

    render(){
      let x = ZVtan(this.x);
			let y = ZVtan(this.y);
			
			let m = [
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[x, y, 1, 0],
				[0, 0, 0, 1]
			];
			
			this.matrix = m;
			return m;
    }

    val(x, y){
      if (arguments.length == 1){
        y = x;
      }

      this.x = x || this.x;
      this.y = y || this.y;
    }
  }

  ZV.World = World;
  ZV.Point = Point;
  ZV.Transform = {};
  ZV.Transform.Translate = Translate;
  ZV.Transform.Scale = Scale;
  ZV.Transform.RotateX = RotateX;
  ZV.Transform.RotateY = RotateY;
  ZV.Transform.RotateZ = RotateZ;
  ZV.Transform.Skew = Skew;
  ZV.Transform.SkewX = SkewX;
  ZV.Transform.SkewY = SkewY;
  ZV.Transform.SkewZ = SkewZ;
  
  // Converts Degrees to Radians
  // ZV Only uses radians (for efficiency)
	var radiansPerDegree = Math.PI/180;
	function degreesToRandians(deg){
		return parseFloat(deg) * radiansPerDegree;
	}
  ZV.degreesToRandians = degreesToRandians;
  ZV.d2r = degreesToRandians;
  
  function matrixMultiply(mat0, mat1){
    var mat2 = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
    
    let i = 4;
    while(i--){
      let j = 4;
      while (j--){
        let k = 4;
        while(k--){
          mat2[i][j] += mat0[i][k] * mat1[k][j];
        }
      }
    }
    
    return mat2;
  }

  function matrixNew(){
    return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
  }
  
  /*
  function matrixDuplicate(mat0){
    let mat1 = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
    
    let i = 4;
    while(i--){
      let j = 4;
      while (j--){
        mat1[i][j] = mat0[i][j];
      }
    }
    
    return mat1;
  }
  */
})();