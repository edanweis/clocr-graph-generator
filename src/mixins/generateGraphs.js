import Graph, { UndirectedGraph, DirectedGraph, MultiDirectedGraph } from 'graphology';
import { clusters, erdosRenyi, girvanNewman } from 'graphology-generators/random';
import { complete, ladder, path } from 'graphology-generators/classic';
import { caveman, connectedCaveman } from 'graphology-generators/community';
import { krackhardtKite } from 'graphology-generators/small'; 

import mtxObject from 'ngraph.sparse-collection/HB/plat1919';
import { loadFromObject } from 'ngraph.serialization/mtx';
import { faker } from '@faker-js/faker';

// import {parse} from 'papaparse';
import deezer_nodes from '@/assets/deezer_target.csv';
import deezer_edges from '@/assets/deezer_edges.json' assert { type: "json" };

// import a sequence of json objects in @/assets/graphs/ using vite glob imports
const networkx_graphs = import.meta.glob('@/assets/graphs/*.json', { as: 'json', eager: true })

// console.log(networkx_graphs)
const generate = {
        data() {
            return {
                min_nodes: 4,
                max_nodes: 10,
                min_edges: 10,
                max_edges: 100,
                networkx_graphs: null,
                graphTypes: [
                    // { name: 'path', func: path },
                    // { name: 'ladder', func: ladder },
                    { name: 'networkx'},
                    // { name: 'complete', func: complete },
                    // { name: 'erdosRenyi', func: erdosRenyi },
                    // { name: 'caveman', func: caveman },
                    // { name: 'connectedCaveman', func: connectedCaveman },
                    // { name: 'krackhardtKite', func: krackhardtKite },
                    // { name: 'girvanNewman', func: girvanNewman },
                    // { name: 'clusters', func: clusters },
                ],
                socialGraphs: {
                    deezer: { edges: deezer_edges, nodes: deezer_nodes },
                }
            }
        },
        created(){
            
        },
        methods: {
            getSocialGraph(name) {
                let sg = this.socialGraphs[name]
                // return {nodes: sg.nodes[0], edges: sg.edges.map(e=>{return {source: e[0], target: e[1]}})}
            },
            
            randomWords(n){
                return faker.random.words(n)
            },
            getRandom(min, max, float) {
                // get random float


                if (float) return Math.random();
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min)) + min;
            },
            generateRandomGraphs(options) {
                var { n, sparsematrix, networkx } = options

                if (sparsematrix == true) {
                    var graph = loadFromObject(mtxObject);

                    var e = []
                    // n = []

                    graph.forEachNode((node) => {
                        n.push({ id: node.id.toString()})
                    })

                    graph.forEachLink((edge) => {
                        e.push({
                            source: edge.fromId.toString(),
                            target: edge.toId.toString()
                        })
                    })
                    let g = { nodes: n, edges: e }
                    
                    return [g]
                    // graph = graph.map(g=>{
                    //   return {
                    //     edges: g.links,
                    //     nodes: g.nodes
                    //   }
                    // })
                    // return [graph]

                }

                if (networkx == true){
                    let graphs = [];
                    for (let graph of Object.values(networkx_graphs)) {
                        // console.log(graph.default.graph.name)
                        var key = Object.values(networkx_graphs).indexOf(graph)

                        let g = {
                            nodes: graph.nodes.map(n => { return { key: n.id, label: graph.default.graph.name}}),
                            edges: graph.links.map(l => {
                                return {
                                    source: l.source,
                                    target: l.target,
                                    // gnerate random alphanumeric string as key
                                    key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                            }}),
                            key 
                        }
                        // console.log(g)
                        graphs.push({ ...MultiDirectedGraph.from(g).export(), type: 'networkx'})
                    }
                    
                    return graphs
                }

                let graphs = []
                for (let i = 0; i < n; i++) {
                    let graphType = this.graphTypes[Math.floor(Math.random() * this.graphTypes.length)];

                    if (graphType.name === 'complete' || graphType.name === 'ladder' || graphType.name === 'path') {
                        var g = graphType.func(Graph, this.getRandom(this.min_nodes, this.max_nodes))
                    } else if (graphType.name === 'erdosRenyi') {
                        var g = graphType.func(DirectedGraph, { order: this.getRandom(2, 10), probability: this.getRandom(0.05, 0.2, true) });
                    } else if (graphType.name === 'caveman') {
                        var g = graphType.func(DirectedGraph, this.getRandom(3, 20), this.getRandom(3, 20))
                    } else if (graphType.name === 'connectedCaveman') {
                        var g = graphType.func(DirectedGraph, this.getRandom(3, 20), this.getRandom(3, 20))
                    } else if (graphType.name === 'krackhardtKite') {
                        var g = graphType.func(DirectedGraph)
                    } else if (graphType.name === 'girlvanNewman') {
                        var g = graphType.func(DirectedGraph)
                    } else if (graphType.name === 'clusters') {
                        var g = graphType.func(DirectedGraph, {
                            order: this.getRandom(10, 100),
                            size: this.getRandom(10, 1000),
                            clusters: this.getRandom(1, 10),
                        })
                    }
                    // console.log(g.edges);
                    
                    // let g_extra = {
                    //     nodes: g.nodes(),
                    //     edges: {
                    //         ...g.edges().map(e => {
                    //             return {
                    //                 ...e,
                    //                 label: self.sample(['+', '-']),
                    //                 style: { lineWidth: Math.random() > 0.9 ? 5 : self.getRandom(3, 3) }
                    //             }
                    //         })
                    //     }
                    // }
                    // let graph = graphType.func(DirectedGraph, this.getRandom(this.min_nodes, this.max_nodes));
                    // graphs.push({ ...this.styleGraph(g.export()), type: graphType.name })
                    
                    // graphs.push({ ...g.export(), type: graphType.name })
                }
                // console.log(graphs)
                return graphs
            },
        
    }
}

export default generate