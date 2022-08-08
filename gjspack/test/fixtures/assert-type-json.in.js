import "./foo.json" assert { type: "json" };
import bar from "./bar.json" assert { type: "json" };
import "./a.js" assert { type: 'json' };
import "./b.foo" assert { type:'json'};
import "./c.bar" assert {type:"json" };
