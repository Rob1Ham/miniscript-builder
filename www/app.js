var numSocket = new Rete.Socket('Number');
var policySocket = new Rete.Socket('Policy');
var keySocket = new Rete.Socket('Key');

var VueNumControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: `<input type="number" min="1" step="1" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop="" @pointerdown.stop="" @pointermove.stop=""/>`,
  data() {
    return {
      value: 1,
    }
  },
  methods: {
    change(e){
      this.value = +e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

var VueStringControl = {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: `<input type="text" :readonly="readonly" :value="value" @input="change($event)" @dblclick.stop="" @pointerdown.stop="" @pointermove.stop=""/>`,
  data() {
    return {
      value: "",
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value)
      this.emitter.trigger('process');
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
}

class NumControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueNumControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

class StringControl extends Rete.Control {

  constructor(emitter, key, readonly) {
    super(key);
    this.component = VueStringControl;
    this.props = { emitter, ikey: key, readonly };
  }

  setValue(val) {
    this.vueContext.value = val;
  }
}

class NumComponent extends Rete.Component {

  constructor(){
    super("Number");
  }

  builder(node) {
    var out1 = new Rete.Output('num', "Number", numSocket);

    return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
  }

  worker(node, inputs, outputs) {
    outputs['num'] = node.data.num;
  }
}

class KeyComponent extends Rete.Component {

  constructor(){
    super("Key");
  }

  builder(node) {
    var out = new Rete.Output('key', "Policy", policySocket);
    return node.addControl(new StringControl(this.editor, 'key')).addOutput(out);
  }

  worker(node, inputs, outputs) {
    outputs['key'] = `pk(${node.data.key ? node.data.key : ''})`;
  }
}

class AndComponent extends Rete.Component {
  constructor(){
    super("And");
  }

  builder(node) {
    var inp1 = new Rete.Input('pol1',"Policy", policySocket);
    var inp2 = new Rete.Input('pol2', "Policy", policySocket);
    var out = new Rete.Output('pol', "Policy", policySocket);

    inp1.addControl(new StringControl(this.editor, 'pol1'))
    inp2.addControl(new StringControl(this.editor, 'pol2'))

    return node
        .addInput(inp1)
        .addInput(inp2)
        .addControl(new StringControl(this.editor, 'preview', true))
        .addOutput(out);
  }

  worker(node, inputs, outputs) {
    var p1 = inputs['pol1'].length?inputs['pol1'][0]:node.data.pol1;
    var p2 = inputs['pol2'].length?inputs['pol2'][0]:node.data.pol2;

    var pol = `and(${p1 ? p1 : ''},${p2 ? p2 : ''})`;
    this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(pol);
    outputs['pol'] = pol;
  }
}

// TODO: add probabilities
class OrComponent extends Rete.Component {
  constructor(){
    super("Or");
  }

  builder(node) {
    var inp1 = new Rete.Input('pol1',"Policy", policySocket);
    var inp2 = new Rete.Input('pol2', "Policy", policySocket);
    var out = new Rete.Output('pol', "Policy", policySocket);

    inp1.addControl(new StringControl(this.editor, 'pol1'))
    inp2.addControl(new StringControl(this.editor, 'pol2'))

    return node
        .addInput(inp1)
        .addInput(inp2)
        .addControl(new StringControl(this.editor, 'preview', true))
        .addOutput(out);
  }

  worker(node, inputs, outputs) {
    var p1 = inputs['pol1'].length?inputs['pol1'][0]:node.data.pol1;
    var p2 = inputs['pol2'].length?inputs['pol2'][0]:node.data.pol2;

    var pol = `or(${p1 ? p1 : ''},${p2 ? p2 : ''})`;
    this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(pol);
    outputs['pol'] = pol;
  }
}

class TimeComponent extends Rete.Component {
  constructor(name="After"){
    super(name);
    this._op = name.toLowerCase();
  }

  builder(node) {
    var inp = new Rete.Input('num',"Number", numSocket);
    var out = new Rete.Output('pol', "Policy", policySocket);

    inp.addControl(new NumControl(this.editor, 'num'))

    return node
        .addInput(inp)
        .addControl(new StringControl(this.editor, 'preview', true))
        .addOutput(out);
  }

  worker(node, inputs, outputs) {
    var n = inputs['num'].length ? inputs['num'][0]:node.data.num;
    n = (n==undefined) ? 0 : n;
    var pol = `${this._op}(${n})`;

    this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(pol);
    outputs['pol'] = pol;
  }
}

class ThreshComponent extends Rete.Component {
  constructor(){
    super("Threshold");
  }

  builder(node) {
    var inp1 = new Rete.Input('num',"Threshold", numSocket);
    var inp2 = new Rete.Input('pol1', "Policy", policySocket);
    var out = new Rete.Output('pol', "Policy", policySocket);

    inp1.addControl(new NumControl(this.editor, 'num'))
    inp2.addControl(new StringControl(this.editor, 'pol1'))

    return node
        .addInput(inp1)
        .addInput(inp2)
        .addControl(new StringControl(this.editor, 'preview', true))
        .addOutput(out);
  }

  worker(node, inputs, outputs) {
    let n = inputs['num'].length ? inputs['num'][0]:node.data.num;
    n = (n==undefined) ? 1 : n;
    let nodeobj = this.editor.nodes.find(n => n.id == node.id);
    // add missing sockets
    for(let i=1; i<=n+1; i++){
      if(inputs[`pol${i}`] == undefined){
        let inp = new Rete.Input(`pol${i}`, "Policy", policySocket);
        inp.addControl(new StringControl(this.editor, `pol${i}`));
        nodeobj.addInput(inp);
      }
    }
    // remove empty sockets at the end, keep only one
    for(let i = nodeobj.inputs.size; i > n; i--){
      let k = `pol${i}`;
      let inp = nodeobj.inputs.get(k);
      if(inp){
        // don't delete if it's connected or has value
        let pol = (inputs[k] && inputs[k].length) ? inputs[k][0]:node.data[k];
        if(pol){
          // last is connected - we actually need to add one
          if(i == nodeobj.inputs.size - 1){
            if(inputs[`pol${i+1}`] == undefined){
              let newinp = new Rete.Input(`pol${i+1}`, "Policy", policySocket);
              newinp.addControl(new StringControl(this.editor, `pol${i+1}`));
              nodeobj.addInput(newinp);
            }
          }
          break;
        }
        // delete otherwise
        let inp = nodeobj.inputs.get(`pol${i+1}`);
        if(inp){
          nodeobj.removeInput(inp);
        }
      }
    }
    let args = "";
    let m = nodeobj.inputs.size;
    for(let i = 1; i<= m; i++){
      let k = `pol${i}`;
      let pol = (inputs[k] && inputs[k].length) ? inputs[k][0]:node.data[k];
      if(pol){
        args += `,${pol}`;
      }
    }
    let pol = `thresh(${n}${args})`;
    nodeobj.controls.get('preview').setValue(pol);
    nodeobj.update();
    outputs['pol'] = pol;
  }
}

(async () => {
  var container = document.querySelector('#rete');
  var components = [
    new NumComponent(),
    new AndComponent(),
    new TimeComponent("After"),
    new TimeComponent("Older"),
    new ThreshComponent(),
    new KeyComponent(),
    new OrComponent(),
  ];

  var editor = new Rete.NodeEditor('demo@0.1.0', container);
  editor.use(ConnectionPlugin.default);
  editor.use(VueRenderPlugin.default);    
  editor.use(ContextMenuPlugin.default, {
    searchBar: false,
  });
  editor.use(AreaPlugin);
  editor.use(CommentPlugin.default);
  editor.use(HistoryPlugin);
  editor.use(ConnectionMasteryPlugin.default);

  var engine = new Rete.Engine('demo@0.1.0');

  components.map(c => {
    editor.register(c);
    engine.register(c);
  });

  var n1 = await components[2].createNode({num: 15});
  var n2 = await components[3].createNode({num: 25});
  var thresh = await components[4].createNode({num: 2});

  n1.position = [80, 200];
  n2.position = [80, 400];
  thresh.position = [500, 240];

  editor.addNode(n1);
  editor.addNode(n2);
  editor.addNode(thresh);

  editor.connect(n1.outputs.get('pol'), thresh.inputs.get('pol1'));
  // editor.connect(n2.outputs.get('pol'), thresh.inputs.get('pol2'));


  editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
    console.log('process');
    await engine.abort();
    await engine.process(editor.toJSON());
  });

  editor.view.resize();
  AreaPlugin.zoomAt(editor);
  editor.trigger('process');
})();