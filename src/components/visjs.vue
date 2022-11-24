<template>
    <button @click="getRandomGraph">refresh</button>
    <div ref="mynetwork">
        <!-- {{graphs?.[0]}} -->
    </div>
</template>
<script>
import { Network, DataSet } from 'vis-network/standalone/umd/vis-network.js ';
import generate from '@/mixins/generateGraphs.js';

export default {
        mixins: [generate],
        data() {
            return {
                graphs: null
            }
        },
        mounted() {
            
            
            this.graphs = this.generateRandomGraphs(100)                
            this.getRandomGraph()
        },
        methods: {
            getRandomGraph() {
                // cycle through this.graphs
                // console.log(this.graphs)
                let g = this.graphs[Math.floor(Math.random() * this.graphs.length)];
                this.drawGraph(g)
                this.currentGraph = g;
            },
            drawGraph(){
                const container = this.$refs.mynetwork
                const options = {
                    nodes: {
                        color: '#ff0000',
                        fixed: false,
                        font: '12px arial red',
                        scaling: {
                            label: true
                        },
                        shadow: true
                    },
                    edges: {
                        arrows: 'to',
                        color: 'red',
                        font: '12px arial #ff0000',
                        scaling: {
                            label: true,
                        },
                        shadow: true,
                        smooth: true,
                    },
                    autoResize: true,
                    height: Math.floor(window.innerHeight*0.7).toString()+'px' ,
                    width: '100%',
                    locale: 'en',
                    clickToUse: true,
                    type: 'directed',
                }

                // delete key/values by name from options
                
                var network = new Network(container, this.graphs[0],(options) );

                network.setOptions(options)

            },
            styleGraph(g) {
                return {
                    nodes: new DataSet( g.nodes.map(n => {
                        return {
                            id: n.key,
                            label: n.key
                        }
                    })),
                    edges: new DataSet( g.edges.map(e => {
                        return {
                            from: e.source,
                            to: e.target,
                        }
                    }))
                }
            }
        },

}
</script>
<style lang="">
    
</style>