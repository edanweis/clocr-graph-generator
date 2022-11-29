<template>
  <main class="main"  @keydown.enterz="onPressSpace" >
    <p v-if="currentGraph?.type">{{ currentGraph.type }}</p>
    <div ref="canvas" class="wrapper" :style="{filter: `blur(${Math.random() > 0.8 ? sample([0.2, 0.3,0.4, 0.5,0.6]) : 0}px)`}"></div>
  
    <div style="z-index:4; position: absolute;left:10px;top:10px;">

      <button ref="saveButton"  @click="saveNGraphs">random</button>
      &nbsp;
      <button @click="showBboxes = !showBboxes; saveNGraphs()">{{showBboxes? 'hide' : 'show'}} bounding boxes</button>
    </div>
    <!-- <pre v-if="currentbboxes" style="font-size: 12px;">{{ currentbboxes.join('\n').replaceAll(' ','\t')}}</pre> -->
    <pre v-if="currentbboxes && showBboxes" style="font-size: 12px;">{{ bboxes}}</pre>
  </main>
</template>

<script>
import G6 from '@antv/g6';
import randomColor from 'randomcolor';
import generate from '@/mixins/generateGraphs.js';
import { readableColor } from 'color2k';
import { ext } from '@antv/matrix-util';
import { timeout } from 'd3-timer';
import debounce from "lodash.debounce"
import { saveAs } from 'file-saver';

export default {
  mixins: [generate],
  data() {  
    return {
      polarities: [],
      p_leg: {
          '+': 's',
          '–': 'o',
          '-': 'o',
          'S': 's',
          'P': 's',
          'O': 'o',
          's': 's',
          'p': 's',
          'o': 'o',
        },
      renderCounter: 0,
      counter: 0,
      showBboxes: false,
      canvasWidth: 1024,
      canvasHeight: 1024,
      bboxes: [],
      currentbboxes: '',
      classes: {
        variable: 1,
        ne_arrow: 2, 
        nw_arrow: 3,
        se_arrow: 4,
        sw_arrow: 5,
        r_loop: 6,
        b_loop: 7,
        s: 8,
        o: 9,
        '+': 10,
        '-': 11,
        ne_arrow_s: 12,
        nw_arrow_s: 13,
        se_arrow_s: 14,
        sw_arrow_s: 15,
        ne_arrow_o: 16,
        nw_arrow_o: 17,
        se_arrow_o: 18,
        sw_arrow_o: 19
      },
      windowHeight: null,
      windowWidth: null,
      graphs: [],
      c: null,
      currentGraph: null,
      totalLoopSymbols: 0,
    }
  },
  created() {
    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("keydown", this.onKeydown);
  },
  destroyed() {
    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("keydown", this.onKeydown);
  },
  mounted() {
    var self=this;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    const transform = ext.transform;
    this.$refs.saveButton.click()
    
    G6.registerNode( // random image
      'random-image',
      {
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1]

          // change original shape
          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
          });
        
          const img = group.addShape('image', {
            attrs: {
              img: `https://loremflickr.com/${width}/${width}?lock=${self.getRandom(1, 9999)}&random=1`,
              x: -width / 2,
              y: -height / 2,
            },
            name: 'random-image-shape',
          });
        },
      },

      'ellipse',
    );
    
    G6.registerNode( // paragraph
      'paragraph',
      {
        options: {
          textAlign: 'left',
          size: [200,200]
        },
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1]

          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
            
          });
          
          
        
          const symbol = group.addShape('text', {
            attrs: {
              fill: cfg.style.stroke,
              textAlign: 'left',
              labelCfg: {
                style: {
                  textAlign: 'left',
                },
              },
              textBaseline: 'middle',
              fontSize: 20,
              x: 0,
              y: 0,
            },
            name: 'loop-text',
          })
        },
      },

      'ellipse',
    );

    G6.registerNode( // ellipse-rect
      'ellipse-rect',
      {
        // draw(cfg, group) {
        //   console.log(cfg.x);
        //   // self.getCoords(cfg.x, cfg.y, cfg.size[0], cfg.size[1])
        // },
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          const scale = 0.8
          
          group.get('children')[0].attr({
            stroke: 'transparent',
            rx: width*0.8,
            ry: height*0.8,
          });

          const labelBBox = group.getBBox();
          
          const keyShape = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              stroke: self.showBboxes ? 'aqua': 'transparent',
              fill: 'transparent',
              x: -(labelBBox.width * scale)/2,
              y: -(labelBBox.height * scale)/2,
              width: labelBBox.width*scale,
              height: labelBBox.height*scale
              
            },
            draggable: true,
          });
          
          keyShape.toFront()
          // console.log('pushing variable', cfg.id);
          

        },
      },

      'ellipse',
    );

    G6.registerNode( // ellipse-padded
      'ellipse-padded',
      {
        afterDraw(cfg, group) {
          const size = this.getSize(cfg); // translate to [width, height]
          const width = size[0];
          const height = size[1];
          // console.log(cfg)
          
          group.get('children')[0].attr({
            stroke: 'transparent',
            fill: 'transparent',
            // rx: width*0.9,
            // ry: height*0.9,
          });

          
          const keyShape = group.addShape('ellipse', {
            attrs: {
              ...cfg.style,
              // fill: 'transparent',
              ry: height*0.4,
              rx: width*0.4,
            },
            draggable: true,
          });

          const labelBBox = keyShape.getBBox();

          // console.log({...group.get('children')[0].cfg.parent.cfg});
          

          const bbox = group.addShape('rect', {
            attrs: {
              ...cfg.style,
              // stroke: 'transparent',
              stroke: self.showBboxes ? 'aqua' : 'transparent',
              fill: 'transparent',
              x: -(labelBBox.width) / 2,
              y: -(labelBBox.height) / 2,
              width: labelBBox.width,
              height: labelBBox.height

            },
            draggable: true,
          });

        
          keyShape.toBack()
          bbox.toFront()

        },
        update: undefined
      },
      // Extend the 'single-node'
      'ellipse',
    );

 
    G6.registerEdge( // loopEdge
      'loopEdge', {
      options: {
        style: {
          stroke: '#000',
        },
      },
      labelAutoRotate: true,
      afterDraw(cfg, group) {
        const shape = group.get('children')[0];
        // change shape
        const endPoint = shape.getPoint(0.9);
        const midPoint = shape.getPoint(0.5);
        const startPoint = shape.getPoint(0);

        // draw line at angle of bearing

        const p = self.sample(['+', '–', '-', 's', 'p', 'o', 'S', 'P', 'O'])

        
        
        // get id
        self.polarities.push({id: cfg.id, polarity: self.p_leg[p]})

        const length = shape.cfg.totalLength
        let radian = Math.atan((startPoint.y - endPoint.y) / ((startPoint.x - endPoint.x)));
        if (length < 100) {
          // set attribute
          shape.attr({
            stroke: 'transparent',
            text: length < 100 ? 'hide' : 'show',
            style: {
              endArrow: false,
              startArrow: false
            }
          });
          shape.hide()
          // this.setState('selected', true);
          
        } else {

          if (self.showBboxes) {
            group.addShape('text', {
              attrs: {
                text: self.getBearing(startPoint, endPoint),
                fill: 'red',
                textAlign: 'start',
                textBaseline: 'middle',
                fontVariant: 'bold',
                fontSize: 28,
                x: endPoint.x,
                y: endPoint.y,
              },
              name: 'polarity-text-shape',
            });

          }

          shape.attr({

            endArrow: self.sample([true, {
              fillOpacity: Math.random() > 0.9 ? 0.5 : 1,
              fill: cfg.style.stroke,
              path: self.sample([
                G6.Arrow.triangle(self.getRandom(5, 8), self.getRandom(10, 20), 0),
                G6.Arrow.vee(self.getRandom(5, 15), self.getRandom(2, 20), 0),
                // G6.Arrow.circle(this.getRandom(2, 6), 0)
              ])
            }]),

          });


          const polarity = group.addShape('text', {
            attrs: {
              text: p,
              fill: cfg.style.stroke,
              textAlign: 'start',
              textBaseline: 'middle',
              fontVariant: 'bold',
              fontSize: cfg.style.fontSize,
              x: endPoint.x - self.sample([20, -20]) * Math.cos(radian + Math.PI / 2),
              y: endPoint.y - self.sample([20, -20]) * Math.sin(radian + Math.PI / 2),
            },
            name: 'polarity-text-shape',
          });
          let matrix = polarity.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const polarityMatrix = transform(matrix, [
            ['t', 0, 0], // translate
            ['s', 1, 1],
          ]);
          polarity.setMatrix(polarityMatrix);

          if (Math.random() > 0.9) {

            const delay = group.addShape('text', {
              attrs: {
                text: '‖',
                fill: cfg.style.stroke,
                textAlign: 'start',
                textBaseline: 'middle',
                fontWeight: 100,
                fontFamily: 'Lato',
                fontSize: 40,
                x: midPoint.x,
                y: midPoint.y,
              },
              name: 'polarity-text-shape',
            });

            delay.rotateAtStart(radian);

          }


          

          let { maxX, maxY, minX, minY } = group.getBBox()

          if (self.showBboxes) {
            const bbox = group.addShape('rect', {
              attrs: {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,

                stroke: 'red',
                lineWidth: 3,
              },
              name: 'bbox-shape',
            });
          }


        }

        if (length > 300 && self.totalLoopSymbols < 7) {
          self.totalLoopSymbols += 1


          // shape.attr({
          //   stroke: 'transparent',
          //   endArrow: false,
          // });

          // const stroke = (cfg.style && cfg.style.stroke) || this.options.style.stroke;

          let size = 60

          // the init matrix for a shape or a group is null, initiate it with unit matrix




          const loop = group.addShape('image', {
            attrs: {
              img: `arrows/${self.getRandom(1, 72)}.png`,
              x: midPoint.x - size / 2,
              y: midPoint.y - size / 2,
              width: size,
              height: size,
            },
            name: 'loop-image',
          });





          let loopText = self.sample([self.sample(['–', '—', '-']), '+', self.sample(['R', 'B']) + self.sample([self.getRandom(1, 20)])])
          // check if loopText starts with R or B
          let loopTextSize = loopText.startsWith('R') || loopText.startsWith('B') ? 18 : 30
          let loopFontWeight = loopText.startsWith('R') || loopText.startsWith('B') ? 400 : 200

          // if cfg.labelCfg.text includes a "p"
          const symbol = group.addShape('text', {
            attrs: {
              text: loopText,
              // fill: cfg.style.stroke,
              fill: self.sample(['black', 'red', 'blue']),
              textAlign: 'center',
              textBaseline: 'middle',
              fontSize: loopTextSize,
              fontWeight: loopFontWeight,
              x: midPoint.x,
              y: midPoint.y //- (size / 2),
            },
            name: 'loop-text',
          })

          let matrix = loop.getMatrix();
          if (!matrix) matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

          const symbolMatrix = transform(matrix, [
            ['t', -100, -50], // translate
            ['s', 1, 1],
          ]);


          // const loopMatrix = transform(matrix, [
          //   ['t', -100,-50], // translate
          //   ['s', 1, 1],
          //   ['r', 10, 1],
          // ]);

          symbol.setMatrix(symbolMatrix);
          loop.setMatrix(symbolMatrix);




          if (self.showBboxes) {
            let { maxX, maxY, minX, minY } = loop.getBBox()

            group.addShape('rect', {
              attrs: {
                x: minX - 100,
                y: minY - 50,
                width: maxX - minX,
                height: maxY - minY,
                stroke: 'red',
                lineWidth: 1,
              }
            })
          }

          // loop.setMatrix(loopMatrix);


        }



        return shape;
      },
      update: undefined


    }, 'quadratic'
    )

    // this.graphs = this.generateRandomGraphs(1)
    // this.graphs = this.graphs.map(g=>
    //   this.styleGraph(g)
    // )

  },
  methods: {


    saveToTextFile(padded_counter){
      // write bboxes to a csv file
      var blob = new Blob([this.bboxes.join('\n')], { type: "text/plain;charset=utf-8" });
      
      saveAs(blob, `${padded_counter}.txt`);

    },  

  
    getBearing(startPoint, endPoint) {
      // if endPoint x is greater than startPoint x, then it's east
      const east = endPoint.x > startPoint.x
      // if endPoint y is greater than startPoint y, then it's south
      const south = endPoint.y > startPoint.y
      // if endPoint x is less than startPoint x, then it's west
      const west = endPoint.x < startPoint.x
      // if endPoint y is less than startPoint y, then it's north
      const north = endPoint.y < startPoint.y
      // determine the quadrant of the bearing
      const quadrant = (east && south) ? 'se' : (east && north) ? 'ne' : (west && north) ? 'nw' : 'sw'
      return quadrant
    },

    getCoords(x,y,width,height){
      console.log(x,y,width,height);
      

    },

    pushBBox(c, x, y, width, height){     
      
      let cls = this.classes[c]
      
      var centerX = (x + width / 2) / this.canvasWidth; 
      var centerY = (y + height / 2) / this.canvasHeight;
      
      var width = width / this.canvasWidth
      var height = height / this.canvasHeight

      this.bboxes.push(`${cls} ${x} ${y} ${width} ${height}`)
      this.currentbboxes.push(`${c} ${x} ${y} ${width} ${height}`)     
      
    },

    onKeydown(event) {
      if (event.code === "Space") {
        this.$refs.saveButton.click()
        
      }
    },
    saveNGraphs(){
      this.counter +=1
      this.currentbboxes = []
      let g = this.generateRandomGraphs(1)
      let p = this.styleGraph(g[0])
      this.drawGraph(p, this.causalLoopStyle(), this.counter)
    },
    
    styleGraph(g) {
      var self = this;
      var cls = self.causalLoopStyle()
      
      var g = {
        nodes: g.nodes.map(n => {
          return {
            ...n,
            id: n.key,
            label: Math.random() > 0.8 ? `${this.randomWords(2)}\n${this.randomWords(2)}`.toUpperCase() : `${this.randomWords(2)}\n${this.randomWords(2)}`,
            // comboId: this.sample(['a', 'b'])
          }
        }),
        // combos: [
        //   { // define comboA
        //     id: 'a',
        //     label: 'A',
        //     parentId: 'a',
        //     size: 100,
        //     type: 'circle'
        //   },
        //   { // define comboB
        //     id: 'b',
        //     label: 'A',
        //     parentId: 'b',
        //     size: 100,
        //     type: 'circle'
        //   }
        // ],
        edges: g.edges.map(e => {

          return {
            ...e,
            // comboId: this.sample(['a', 'b']),
            // label: ['',self.sample(['', '-'])],
            // symbol: Math.random() > 0.95 ? true : false,
            style: {
              ...cls.defaultEdge.style,
              lineWidth: Math.random() > 0.9 ? this.getRandom(2, 5) : this.getRandom(1, 2),
              stroke: Math.random() > 0.9 ? randomColor({ luminosity: 'bright' }) : cls.defaultEdge.style.stroke, 
              lineDash: Math.random() > 0.1 ? null : [5,5],

            },
            source: e.source,
            target: e.target,
          }
        })
      }
      
      return g
    },
  
    drawGraph(g, style, name) {
      var self = this
      if (this.graph) {
        this.graph.destroy()
        this.totalLoopSymbols = 0
      }        
        this.graph = new G6.Graph({
          animation: false,
          container: this.$refs.canvas,
          width: 640,
          height: 640,
          fitCenter: true,
          fitView: true,
          fitViewPadding: 20,

          gpuEnabled: true,
          preventOverlap: {padding: 20},
          modes: {
            default: ['drag-canvas'  , 'zoom-canvas', 'drag-node'],
          },
          ...style
        })

        this.graph.fitCenter(180)


      this.graph.data({
        nodes: g.nodes,
        edges: g.edges,
      });

      this.graph.updateLayout({
                
        
        type: 'forceAtlas2',
        onLayoutEnd: (e) => {
          // workaround strange double render issue
          if (this.renderCounter == 1) {
              
              this.pushNodeBBoxes()
              this.pushEdgeBBoxes()
              setTimeout(() => {
                let padded_counter = this.counter.toString().padStart(6, '0')
                
                // uncomment to save:
                // this.graph.downloadImage(`${padded_counter}`, 'image/jpeg', 'white')
                // this.saveToTextFile(padded_counter)

              }, 300);
            this.renderCounter = 0
          } else{
            this.renderCounter += 1
          }
          
        },
        fitView: true,
        linkDistance: this.getRandom(100,300),
        preventOverlap: true,
      })

      
      

      this.graph.render();
      // let nodes = this.graph.getNodes()
      // deduplicate nodes
      // let dedupedNodes = nodes.filter((v,i,a)=>a.findIndex(t=>(t._cfg.id === v._cfg.id))===i)
      
      
      
    },

    pushEdgeBBoxes(){
      let edges = this.graph.getEdges()
      edges.forEach((e) => {
        const {x, y, minX, maxX, minY, maxY} = e.getContainer().getBBox()
        const width = (maxX - minX) / this.canvasWidth
        const height = (maxY - minY) / this.canvasHeight
        const centerX = (x + width / 2) / this.canvasWidth;
        const centerY = (y + height / 2) / this.canvasHeight;
        
        let m = e.getModel()
        

        // find polarity by id
        let polarity = this.polarities.find(p => p.id == m.id).polarity
        
        
        let cls = `${this.getBearing(m.startPoint, m.endPoint)}_arrow_${polarity}`
        if ((centerX != 0) && (polarity != undefined)){
          this.pushBBox(cls, centerX, centerY, width, height)
        } else{
          // console.log('zero')
        }

      })    
    },

    pushNodeBBoxes(){
      
      let nodes = this.graph.getNodes()
      for (let n of nodes) {
        let {width, height} = n.getContainer().getBBox()
        let { x, y } = n.getModel()
        let centerX = (x + (n.getModel().size[0] / 2)) / this.canvasWidth
        let centerY = (y + (n.getModel().size[1] / 2)) / this.canvasHeight
        this.pushBBox('variable', centerX, centerY, width, height)
        
      }
      
    },


    sample(arr){
      return arr[Math.floor(Math.random() * arr.length)]
    },

    resizeHandler() {
      this.windowHeight = window.innerHeight;
      this.windowWidth = window.innerWidth;
      if (!this.graph || this.graph.get('destroyed')) return;
      if (!this.$refs.canvas || !this.$refs.canvas.scrollWidth || !this.$refs.canvas.scrollHeight) return;
      console.log('changeing size', this.$refs.canvas.scrollHeight)
      this.graph.changeSize(this.windowWidth, this.windowHeight)
    },

    causalLoopStyle() {
      var self = this
      
      let fill = Math.random() > 0.1 ? 'rgba(255,255,255,0)' : randomColor({ luminosity: 'light' })
      let textFill = fill == 'white' ? randomColor({ luminosity: 'dark' }) : readableColor(fill)
      let edgeStroke = Math.random() > 0.7 ? this.sample(['blue', 'black']) : this.sample(['black', randomColor({ luminosity: 'dark' })]) 
      let nodeStroke = fill !== 'rgba(255,255,255,0)' ? 'transparent' : randomColor({ hue: self.sample(['monochrome', 'blue']) })
      let nodeWidth = self.getRandom(100, 150)
      let nodeHeight = self.getRandom(15, 75)

      return {
        defaultNode: {
          ...this.sample([
            { type: 'ellipse-padded', size: [150, 75]},
            { type: 'ellipse-rect', size: [120, 45]},          
          ]),
          
          //'rect', 'circle'
          
          labelCfg: {
            position: 'center',
            fontSize: self.sample([12, 16]),
            style: {
              fontSize: self.sample([12, 16]),
              fill: textFill,
              fontFamily: this.sample(['Arial', 'serif']),
              background: {
                // padding: [20, 20, 20, 20],
              },
            },
          },
          style: {
            fill: fill,
            // fillOpacity: this.sample([true, false]) ? 0 : 1,
            strokeOpacity: this.sample([true,false])?0:1,
            stroke: nodeStroke,
            lineWidth: Math.random() > 0.9 ? 1 : 3,
          },
        },
        defaultEdge: {
          // type: this.sample(['line', 'quadratic', 'mid-point-edge', 'polarityEdge']),
          // type: this.sample(['polarityEdge']),
          type: 'loopEdge',
          curveOffset: Math.random() > 0.9 ? 0 : this.getRandom(20, 60),
          curvePosition: 0.5,
          hidden: false,
          style: {
            stroke: edgeStroke,
            lineWidth: this.sample([1,2,3]),
            startArrow: Math.random() >0.9 ? {
              fillOpacity: Math.random() > 0.9 ? 0.5 : 1,
              fill: edgeStroke,
              path: this.sample([
                G6.Arrow.circle(this.getRandom(2, 6), 0)
              ])
            } : false,
            // lineJoin: 'round',
            // lineCap: 'round',
          },
          labelCfg: {
            autoRotate: true,
            ...this.sample([{ refX: self.sample([10, 100]), refY: self.sample([-10, 0, 10]) }]),
            text: self.sample(['-', '+']),
            style: {
              background: {
                fill: '#ffffff',
                fillOpacity: 0,
                stroke: randomColor(),
                // padding: [2, 2, 2, 2],
                radius: 21,
              },

            },
          },
        },
        defaultCombo: {
          // ... Other properties for combos
          style: {
            fill: '#steelblue',
            stroke: '#eaff8f',
            lineWidth: 5,
            // ... Other style properties
          },
        },

      }
    },
  }
}

</script>


<style scoped>

header {
  line-height: 1.5;
}

.wrapper{
  border: 1px solid black;
  max-width: 1024px;
  max-height: 1024px;
}

.main{
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;
  margin: 0;
  padding: 0;
  height: 100vh;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
