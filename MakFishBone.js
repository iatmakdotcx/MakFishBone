var MakFishBone = (function (window) {
	var MakFishBone = function (canvas, options) {
		return new MakFishBone.fn.init(canvas, options);
	}
	const
		MinLength = 100;
	MakFishBone.fn = MakFishBone.prototype = {
		constructor: MakFishBone,
		init: function (canvas, options) {
			this.canvas = canvas;
			var dpr = window.devicePixelRatio || 1;
			canvas.width = parseInt(canvas.style.width) * dpr;
			canvas.height = parseInt(canvas.style.height) * dpr;
			this.ctx = canvas.getContext("2d");
			var defaultConfig = {
				/*json数据*/
				data: null,
				/*是否可以拖动，默认是true */
				dragable: true,
				/*是否显示工具条 */
				showToolbar: true,
				/* debug模式 */
				debug: true,
				//交错显示
				stagger: true,
				//背景
				sceneBackgroundImage: null,
				//单击节段回调
				clickNodeCallback: null
			};
			this.cfg = $.extend(defaultConfig, options);                    
			var stage = new JTopo.Stage(canvas);
			//显示工具栏
			showJTopoToobar(stage);
			this.scene = new JTopo.Scene(stage);
		   
		},
		getFishBoneNode : function (position,text) {
			var jNode = new JTopo.Node(text || "");
			jNode.shadow = false;
		   // jNode.showSelected = false;
			jNode.dragable = false;
			if (position) {
				jNode.setLocation(position.x, position.y);
			}
			jNode.setSize(0, 0);
			if (this.cfg.debug) {
				jNode.setSize(5, 5);
			}
			return jNode;
		},
		getNodeTextRect: function (node, text) {
			this.ctx.font = node.font;
			var textArray = text.split('\n');
			var maxLength = 0; maxText = textArray[0];
			for (var i = 0; i < textArray.length; i++) {
				var rowwidth = this.ctx.measureText(textArray[i]).width;
				if (rowwidth > maxLength) {
					maxLength = rowwidth;
					maxText = textArray[i];
				}
			}
			var lineHeight = this.ctx.measureText("田").width;
			return {
				width: maxLength,
				height: lineHeight * textArray.length,
				lineHeight: lineHeight
			}
		},
		getNewTextNode: function (PntA, text, PntZ) {
			var tmptext = "";
			for (var i = 0; i < text.length; i++) {
				if (i > 0 && i % 4 == 0) {
					tmptext += "\n";
				}
				tmptext += text[i];                        
			}
			var nodeText = new JTopo.TextNode(tmptext || "");
			nodeText.shadow = false;
			//nodeText.showSelected = false;
			//nodeText.dragable = false;
			nodeText.fontColor = '40,40,40';
			nodeText.font = '16px 微软雅黑';
			nodeText.paint = function (a) {
				a.beginPath();
				a.font = this.font;
				a.strokeStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")";
				a.fillStyle = "rgba(" + this.fontColor + ", " + this.alpha + ")";
				var textArray = this.text.split('\n');
				var maxLength = 0; maxText = textArray[0];
				for (var i = 0; i < textArray.length; i++) {
					var rowwidth = a.measureText(textArray[i]).width;
					if (rowwidth > maxLength) {
						maxLength = rowwidth;
						maxText = textArray[i];
					}
				}
				this.width = maxLength;
				var lineHeight = a.measureText("田").width;
				this.height = lineHeight * textArray.length;

				var x = -this.width / 2;
				var y = -this.height / 2 + lineHeight;
				for (var j = 0; j < textArray.length; j++) {
					a.fillText(textArray[j], x, y);
					y += lineHeight;
				}
				a.closePath();

			};
			var size = this.getNodeTextRect(nodeText, tmptext);
			nodeText.textSize = size;
			var tx = PntA.x, ty = PntA.y;
			if (PntA.y == PntZ.y) {
				//横线
				tx -= size.width;
				ty -= size.lineHeight/2;
			} else {
				//斜线
				tx -= size.width / 2;
				ty -= size.height;
			}
			nodeText.setLocation(tx, ty);
			this.scene.add(nodeText);

			var nodeA = this.getFishBoneNode(PntA);
			this.scene.add(nodeA);

			var nodeZ = this.getFishBoneNode(PntZ);
			this.scene.add(nodeZ);

			nodeZ.assPnt = nodeA;
			nodeA.assPnt = nodeZ;

			var link = new JTopo.Link(nodeA, nodeZ, "");
			link.lineWidth = 3; // 线宽
			link.bundleOffset = 60; // 折线拐角处的长度
			link.arrowsRadius = 15; //箭头大小
			link.bundleGap = 20; // 线条之间的间隔
			link.textOffsetY = 3; // 文本偏移量（向下3个像素）
			link.strokeColor = '0,200,255';
			this.scene.add(link);

			return { nodeA: nodeA, nodeZ: nodeZ, link: link, text: nodeText };
		},
		resetX: function (node, x) {
			node.nodes.nodeA.x += x;
			node.nodes.nodeZ.x += x;
			node.nodes.text.x += x;
			for (var i = 0; i < node.children.length; i++) {
				this.resetX(node.children[i], x);
			}
		},
		resetY: function (node, x, y) {
			node.nodes.nodeA.x += x;
			node.nodes.nodeA.y += y;
			node.nodes.nodeZ.x += x;
			node.nodes.nodeZ.y += y;
			node.nodes.text.x += x;
			node.nodes.text.y += y;
			for (var i = 0; i < node.children.length; i++) {
				this.resetY(node.children[i], x, y);
			}
		},
		HorizontalFlip: function (node) {
			node.nodes.nodeA.x = -node.nodes.nodeA.x;
			node.nodes.nodeZ.x = -node.nodes.nodeZ.x;
			node.nodes.text.x = -node.nodes.text.x;
			for (var i = 0; i < node.children.length; i++) {
				this.HorizontalFlip(node.children[i]);
			}
		},
		VerticalFlip: function (node) {
			node.nodes.nodeA.y = -node.nodes.nodeA.y;
			node.nodes.nodeZ.y = -node.nodes.nodeZ.y;
			node.nodes.text.y = -node.nodes.text.y;
			for (var i = 0; i < node.children.length; i++) {
				this.VerticalFlip(node.children[i]);
			}
		},
		drawLevel: function (depth) {
			if (depth < 0) {
				return;
			}
			var clevels = this.flatData.filter(x => x.level == depth);
			//depth最小为0，偶数为横线，基数为斜线
			var isHorizontal = (depth % 2) === 0; 
			for (var i = 0; i < clevels.length; i++) {
				var arow = clevels[i];
				var lineLength = 100; //todo:假定全部线长度都是100
				//筛选子节点
				var chilnodes = [];
				var tnodes = [];
				for (var k = 0; k < this.AllTmpNode.length; k++) {
					if (this.AllTmpNode[k].path.indexOf(arow.path + "_") === 0) {
						chilnodes.push(this.AllTmpNode[k]);
					} else {
						tnodes.push(this.AllTmpNode[k]);
					}
				}
				this.AllTmpNode = tnodes;

				if (isHorizontal) {
					//横线
					//先计算子节点宽度（分斜线左边部分，和斜线右边部分
					var width_left = [];
					var width_right = [];
					var widthtotal = 0;
					for (var j = 0; j < chilnodes.length; j++) {
						var subnode = chilnodes[j];
						if (subnode.children.length === 0) {
							//没有子节点(固定间隔30)
							width_left.push(15), width_right.push(15);
						} else if (subnode.children.length === 1) {
							//1个子节点（半幅
							width_left.push(Math.abs(subnode.children[0].nodes.nodeA.x));
							width_right.push(0);
						} else {
							//多个子节点
							var xleft = subnode.children[0].nodes.nodeA.x;
							var xright = subnode.children[0].nodes.nodeA.x;
							for (var k = 1; k < subnode.children.length; k++) {
								var growNode = subnode.children[k].nodes.nodeA;
								if (growNode.x < xleft) {
									xleft = growNode.x;
								}
								if (growNode.x > xright) {
									xright = growNode.x;
								}
							}
							width_left.push(Math.abs(xleft)), width_right.push(Math.abs(xright));
						}
						widthtotal += width_left[j] + width_right[j];
					}
					lineLength += widthtotal;
					//计算斜线的基础位置(0,0)作为目标点
					var PntA = { x: -lineLength, y: 0 };
					var PntZ = { x: 0, y: 0 };
					arow.lineLength = lineLength;
					//返回4个节点
					arow.nodes = this.getNewTextNode(PntA, arow.name, PntZ);
					this.AllTmpNode.push(arow);
					//把它的子节点全部放到当前节点上
					var newX = PntA.x;
					console.log(chilnodes);
					for (var j = 0; j < chilnodes.length; j++) {
						var subnode = chilnodes[j];
						newX += width_left[j];
						this.resetX(subnode, newX);
						newX += width_right[j];
					}
					if (i % 2 != 0) {
						//右边(水平翻转整颗树)
						this.HorizontalFlip(arow);
					}
				} else {
					//斜线
					//先计算子节点的高度（子节点的高度，上半部分和下半部分分开计算
					var height_up = [];
					var height_down = [];
					var heighttotal = 0;
					for (var j = 0; j < chilnodes.length; j++) {
						var subnode = chilnodes[j];
						if (subnode.children.length === 0) {
							//没有子节点(固定间隔30)
							height_up.push(15), height_down.push(15);
						} else if (subnode.children.length === 1) {
							//1个子节点（半幅
							height_up.push(subnode.children[0].lineLength);  
							height_down.push(0);
						} else {
							//多个子节点
							var yTop = subnode.children[0].nodes.nodeA.y;
							var yBottom = subnode.children[0].nodes.nodeA.y;
							for (var k = 1; k < subnode.children.length; k++) {
								var growNode = subnode.children[k].nodes.nodeA;
								if (growNode.y < yTop) {
									yTop = growNode.y;
								}
								if (growNode.y > yBottom) {
									yBottom = growNode.y;
								}
							}
							height_up.push(Math.abs(yTop)), height_down.push(Math.abs(yBottom));
						}
						heighttotal += height_up[j] + height_down[j];
					}
					lineLength += heighttotal;
					//计算斜线的基础位置(0,0)作为目标点
					var PntA = { x: -lineLength / 2, y: -lineLength };
					var PntZ = { x: 0, y: 0 };
					arow.lineLength = lineLength;
					//返回4个节点
					arow.nodes = this.getNewTextNode(PntA, arow.name, PntZ);
					this.AllTmpNode.push(arow);
					//把它的子节点全部放到当前节点上
					var newX = PntA.x;
					var newY = PntA.y;
					console.log(chilnodes);
					for (var j = 0; j < chilnodes.length; j++) {
						newY += height_up[j];
						newX += height_up[j] / 2;
						this.resetY(chilnodes[j], newX, newY);
						newY += height_down[j];
						newX += height_down[j] / 2;
					}
					if (i % 2 != 0) {
						//右上斜(垂直翻转整颗树)
						this.VerticalFlip(arow);
					}
				}
			}
			//子元素花完了，画根元素
			this.drawLevel(depth - 1);
		},
		start: function () {
			var flatData = [];
			var maxdepth = 0;
			function dofloatdata(d, path, depth) {
				d.level = depth;
				d.path = path;
				flatData.push(d);
				if (depth > maxdepth) {
					maxdepth = depth; 
				}
				for (var i = 0; i < d.children.length; i++) {
					dofloatdata(d.children[i], path + "_" + i, depth + 1);
				}
			}                    
			dofloatdata(this.cfg.data, "0", 0);
			this.flatData = flatData;
			if (this.cfg.debug) {
				console.log("maxdepth:" + maxdepth);
				console.log(flatData);
			}
			this.AllTmpNode = [];
			this.drawLevel(maxdepth);					
			this.movePntS((this.cfg.data.lineLength + this.canvas.width)/2, this.canvas.height / 2);
		},
		movePntS: function (x, y) {
			for (var i = 0; i < this.scene.childs.length; i++) {
				var a = this.scene.childs[i];
				a.x += x;
				a.y += y;
			}
		},
	}
	MakFishBone.fn.init.prototype = MakFishBone.fn;
	return MakFishBone;
})(window);
