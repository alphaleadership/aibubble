const comp=require("./companies.json")
const fs=require("fs")
comp.links=comp.links.map((link,index)=>({...link,id:`link-${index}`,name:`${link.source} to ${link.target}`}))
fs.writeFileSync("./companies.json",JSON.stringify(comp,null,2))