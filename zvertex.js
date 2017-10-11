
(function(){
	window.ZV = {};
	var ZV = window.ZV;
  
	ZV.World = function(width, height, x, y, z, focal){
		var that = this;
    var settings = {};
		that.children = [];
		
		if (typeof width === 'object'){
			settings = width;
			width = false;
		}
		
		that.width = width || settings.width || 0;
		that.height = height || settings.height || 0;
		that.x = x || settings.x || 0;
		that.y = y || settings.y || 0;
		that.z = z || settings.z || 0;
		that.focal = focal || settings.focal || 1;
		that.ZVW = true;
		
		that.addChild = function(obj){
			if (obj.ZV){
				obj.world = that;
				that.children.push(obj);
			}
		};
		
		that.compute = function(){
			var children = that.children;
			var i = children.length;
			while (i--){
				children[i].compute();
			}
		};
	};
	ZV.World.prototype.constructor = ZV.World;
	
  var zfid = -1;
  function ZFID(){
    zfid++;
    return zfid;
  }
  
	ZV.Point = function(x, y, z){
		var that = this;
		
		that.ZV = true;
		that.parent = false;
		that.world = false;
    that.id = 'ZF_' + ZFID();
		that.children = [];
		that._hasChildren = false;
		that.transforms = [];
		that.computed = {};
		var computed = that.computed;
		that.position = {};
		var position = that.position;
		that._matrix = false;
		that._childMatrix = false;
    that.visible = true;
    that.computeChildren = true;
		
		position.x = x || 0;
		position.y = y || 0;
		position.z = z || 0;
		
		computed.x = position.x;
		computed.y = position.y;
		computed.z = position.z;
		
		that.addChild = function(obj){
			if (obj.ZV){
        obj.parent = that;
        obj.world = that.world;
        that.children.push(obj);
        that._hasChildren = true;
      }
		};
		
		that.addTransform = function(obj){
			that.transforms.push(obj);
      that._matrixMix = false;
      
      var i = that.transforms.length;
			while(i--){
        if (!that.transforms[i].applyToChildren || !that.transforms[i].applyToSelf){
          that._matrixMix = true;
        }
			}
		};
    
		that.compute = function(){
      /*
      Gotta think about how
      Transforms are inherited
      
      Grab parent transform,
      Apply this's transforms
      Setup transform for child
      
      Need 2 tranforms. All start from parents tranform;
      a and b
      
      a: apply if transform.applyToSelf;
      b: apply if transform.applyToChildren;
      
      */
      
      if (that.visible){
        var parent = that.parent;
        var world = that.world;
        
        var matrix = parent ? matrixDuplicate(parent._childMatrix) : [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        var childMatrix = matrixDuplicate(matrix);
        
        var transL = that.transforms.length;
        var i = transL;
        transL--;
        while(i--){
          var t = that.transforms[transL - i];
          var m = t.compute();
          
          if (t.applyToSelf){
            matrix = matrixMultiply(matrix, m);
          }
          if (t.applyToChildren){
            childMatrix = matrixMultiply(childMatrix, m);
          }
        }
        
        that._matrix = matrix;
        that._childMatrix = childMatrix;
        
        var lx = position.x;
        var ly = position.y;
        var lz = position.z;
        
        var x = matrix[0][0] * lx + matrix[0][1] * ly + matrix[0][2] * lz + matrix[0][3];
        var	y = matrix[1][0] * lx + matrix[1][1] * ly + matrix[1][2] * lz + matrix[1][3];
        var z = matrix[2][0] * lx + matrix[2][1] * ly + matrix[2][2] * lz + matrix[2][3];
        
        if (parent){
          x += parent._x;
          y += parent._y;
          z += parent._z;
        }
        
        that._x = x;
        that._y = y;
        that._z = z;
        
        var scale = world.focal ? world.focal / (world.focal + world.z + z) : 1;
        
        computed.x = x * scale;
        computed.y = y * scale;
        computed.z = z;
        
        if (that.computeChildren){
          i = that.children.length;
          while (i--){
            that.children[i].compute();
          }
        }
      }
		};
	};
	ZV.Point.prototype.constructor = ZV.Point;
	
	ZV.Transform = {};
	var transform = ZV.Transform;
	
	transform.ScaleXYZ = function(x,y,z){
		var that = this;
		defaultTransformProperties(that);
    
		that.x = x || 1;
		that.y = y || 1;
		that.z = z || 1;
    
    that.compute = function(){
      
      if (!that.matrix){
        that.matrix = [
          [that.x, 0, 0, 0],
          [0, that.y, 0, 0],
          [0, 0, that.z, 0],
          [0, 0, 0, 1]
        ];
      }
			
			return that.matrix;
		};
    
    that.val = function(x, y, z){
      that.x = x || that.x;
      that.y = y || that.y;
      that.z = z || that.z;
      
      that.matrix = false;
    };
    
    that.compute();
	};
	transform.ScaleXYZ.prototype.constructor = transform.ScaleXYZ;
	
	transform.Scale = function(v){
		var that = this;
		defaultTransformProperties(that);
    
		that.val = v || 1;
		
		that.compute = function(){
			var m = [
				[that.val, 0, 0, 0],
				[0, that.val, 0, 0],
				[0, 0, that.val, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.Scale.prototype.constructor = transform.Scale;
	
	transform.RotateX = function(val){
		var that = this;
		defaultTransformProperties(that);
		that.val = val || 0;
    
		that.compute = function(){
      var rad = that.val;
			var c = Math.cos(rad);
			var s = Math.sin(rad);
			
			var m = [
				[1, 0, 0, 0],
				[0, c, -s, 0],
				[0, s, c, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.RotateX.prototype.constructor = transform.RotateX;
	
	transform.RotateY = function(val){
		var that = this;
		defaultTransformProperties(that);
		that.val = val || 0;
		
		that.compute = function(){
      var rad = that.val;
			var c = Math.cos(rad);
			var s = Math.sin(rad);
			
			var m = [
				[c, 0, s, 0],
				[0, 1, 0, 0],
				[-s, 0, c, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.RotateY.prototype.constructor = transform.RotateY;
	
	transform.RotateZ = function(val){
		var that = this;
		defaultTransformProperties(that);
		that.val = val || 0;
		
		that.compute = function(){
      var rad = that.val;
			var c = Math.cos(rad);
			var s = Math.sin(rad);
			
			var m = [
				[c, -s, 0, 0],
				[s, c, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.RotateZ.prototype.constructor = transform.RotateZ;
	
	transform.Translate = function(x,y,z){
		var that = this;
		defaultTransformProperties(that);
		that.x = x || 0;
		that.y = y || 0;
		that.z = z || 0;
		that.compute = function(){
			var m = [
				[1, 0, 0, that.x],
				[0, 1, 0, that.y],
				[0, 0, 1, that.z],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.Translate.prototype.constructor = transform.Translate;
	
	transform.Skew = function(xy, xz, yx, yz, zx, zy){
		var that = this;
		defaultTransformProperties(that);
		that.xy = xy || 0;
		that.xz = xz || 0;
		that.yx = yx || 0;
		that.yz = yz || 0;
		that.zx = zx || 0;
		that.zy = zy || 0;
		
		that.compute = function(){
			var xy = Math.tan(that.xy);
			var xz = Math.tan(that.xz);
			var yx = Math.tan(that.yx);
			var yz = Math.tan(that.yz);
			var zx = Math.tan(that.zx);
			var zy = Math.tan(that.zy);
			
			var m = [
				[1, xy, xz, 0],
				[yx, 1, yz, 0],
				[zx, zy, 1, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
    
    that.val = function(){
    };
	};
	transform.Skew.prototype.constructor = transform.Skew;
	
	transform.SkewX = function(y, z){
		var that = this;
		defaultTransformProperties(that);
		that.y = y || 0;
		that.z = z || 0;
		
		that.compute = function(){
			var y = Math.tan(that.y);
			var z = Math.tan(that.z);
			
			var m = [
				[1, y, z, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.SkewX.prototype.constructor = transform.SkewX;
	
	transform.SkewY = function(x, z){
		var that = this;
		defaultTransformProperties(that);
		that.x = x || 0;
		that.z = z || 0;
		
		that.compute = function(){
			var x = Math.tan(that.x);
			var z = Math.tan(that.z);
			
			var m = [
				[1, 0, 0, 0],
				[x, 1, z, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.SkewY.prototype.constructor = transform.SkewY;
	
	transform.SkewZ = function(x, y){
		var that = this;
		defaultTransformProperties(that);
		that.x = x || 0;
		that.y = y || 0;
		
		that.compute = function(){
			var x = Math.tan(toRad(that.x));
			var y = Math.tan(toRad(that.y));
			
			var m = [
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[x, y, 1, 0],
				[0, 0, 0, 1]
			];
			
			that.matrix = m;
			return m;
		};
	};
	transform.SkewZ.prototype.constructor = transform.SkewZ;
	
	function defaultTransformProperties(that){
    that.applyToChildren = true;
    that.applyToSelf = true;
    that.valueChanged = false;
	}
  
  
  // Converts Degrees to Radians
  // ZV Only uses radians (for efficiency)
	var radiansPerDegree = Math.PI/180;
	function toRad(deg){
		return parseFloat(deg) * radiansPerDegree;
	}
  ZV.toRad = toRad;
  
  function matrixMultiply(mat0, mat1){
    var mat2 = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
    
    var i = 4;
    while(i--){
      var j = 4;
      while (j--){
        var k = 4;
        while(k--){
          mat2[i][j] += mat0[i][k] * mat1[k][j];
        }
      }
    }
    
    return mat2;
  }
  
  function matrixDuplicate(mat0){
    var mat1 = [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
    
    var i = 4;
    while(i--){
      var j = 4;
      while (j--){
        mat1[i][j] = mat0[i][j];
      }
    }
    
    return mat1;
  }
})();