
const PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KalKaMain AI</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#100d20;color:white;font-family:Arial,sans-serif}
header{text-align:center;padding:30px 15px;background:#211538}
h1{font-size:36px;color:#ffbd59;margin:0}
header p{color:#ddd}
main{max-width:600px;margin:25px auto;padding:18px}
h2{text-align:center}
.upload{display:block;background:#261d3d;border:2px dashed #b18aff;border-radius:15px;padding:30px;text-align:center;cursor:pointer}
input{display:none}
#preview,#result{display:none;width:100%;max-height:400px;object-fit:contain;margin-top:15px;border-radius:12px}
.styles{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0}
.styles button{padding:17px 8px;background:#29203e;color:white;border:1px solid #8c65c7;border-radius:12px;font-size:16px}
.styles button.active{background:#7541b5;border:2px solid #ffbd59}
#generate{width:100%;padding:17px;background:#ffb847;color:#21132d;border:0;border-radius:12px;font-size:18px;font-weight:bold}
button{cursor:pointer}
#status{text-align:center;margin:18px;color:#ffca75}
#download{display:none;text-align:center;background:#36b878;color:white;padding:15px;border-radius:10px;margin-top:12px;text-decoration:none}
</style>
</head>
<body>
<header>
<h1>KalKaMain AI</h1>
<p>Your Photo, Your Style, Your AI Magic ✨</p>
</header>
<main>
<h2>Create Your AI Photo</h2>
<label class="upload">
📸 Choose Your Photo
<input type="file" id="photo" accept="image/png,image/jpeg,image/webp">
<div>Upload your favourite picture</div>
</label>
<img id="preview">
<h2>Choose Your Style</h2>
<div class="styles">
<button class="active" data-style="cartoon">🎨 3D Cartoon</button>
<button data-style="ghibli">🌸 Ghibli</button>
<button data-style="diwali">🪔 Diwali Special</button>
<button data-style="royal">👑 Royal Look</button>
<button data-style="wedding">💍 Wedding Look</button>
<button data-style="professional">📸 Professional</button>
</div>
<button id="generate">✨ Generate AI Photo</button>
<div id="status"></div>
<img id="result">
<a id="download" download="KalKaMain-AI.png">⬇ Download Your Photo</a>
</main>
<script>
let selected="cartoon",file=null;
const photo=document.getElementById("photo");
const preview=document.getElementById("preview");
const result=document.getElementById("result");
const status=document.getElementById("status");
const download=document.getElementById("download");

photo.onchange=()=>{
 file=photo.files[0];
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
  status.textContent="Please select JPG, PNG or WEBP.";
  return;
 }
 preview.src=URL.createObjectURL(file);
 preview.style.display="block";
 result.style.display="none";
 download.style.display="none";
};

document.querySelectorAll(".styles button").forEach(b=>{
 b.onclick=()=>{
  document.querySelectorAll(".styles button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  selected=b.dataset.style;
 };
});

document.getElementById("generate").onclick=async()=>{
 if(!file){status.textContent="Please upload your photo first.";return;}
 if(file.size>15*1024*1024){status.textContent="Photo must be under 15 MB.";return;}

 status.textContent="✨ AI is creating your photo. Please wait...";
 result.style.display="none";
 download.style.display="none";

 const form=new FormData();
 form.append("photo",file);
 form.append("style",selected);

 try{
  const response=await fetch("/api/generate",{method:"POST",body:form});
  const data=await response.json();
  if(!response.ok||!data.image)throw new Error(data.error||"Generation failed");

  result.src="data:image/png;base64,"+data.image;
  result.style.display="block";
  download.href=result.src;
  download.style.display="block";
  status.textContent="🎉 Your AI photo is ready!";
 }catch(e){
  status.textContent="Error: "+e.message;
 }
};
</script>
</body>
</html>`;

export default {
 async fetch(request,env){
  const url=new URL(request.url);

  if(url.pathname==="/api/generate" && request.method==="POST"){
   try{
    if(!env.OPENAI_API_KEY){
     return Response.json({error:"OPENAI_API_KEY secret missing"}, {status:500});
    }

    const form=await request.formData();
    const photo=form.get("photo");
    const style=form.get("style");

    if(!photo || typeof photo==="string"){
     return Response.json({error:"Please upload a photo"}, {status:400});
    }

    if(photo.size>15*1024*1024){
     return Response.json({error:"Photo must be under 15 MB"}, {status:400});
    }

    const prompts={
     cartoon:"Transform the person into a beautiful high quality 3D cartoon character. Preserve their recognizable face and identity.",
     ghibli:"Create a whimsical hand painted anime fantasy portrait with beautiful scenery. Preserve the person's recognizable face and identity.",
     diwali:"Create a premium Indian Diwali portrait with beautiful diyas, glowing golden lights and festive clothing. Preserve the person's face and identity.",
     royal:"Create a luxurious royal Indian portrait with elegant traditional clothing, palace background and cinematic lighting. Preserve the person's face and identity.",
     wedding:"Create an elegant Indian wedding portrait with beautiful wedding outfits and premium decorations. Preserve the person's face and identity.",
     professional:"Create a premium professional studio portrait with elegant clothing and beautiful lighting. Preserve the person's face and identity."
    };

    const apiForm=new FormData();
    apiForm.append("model","gpt-image-2.5-sunburst");
    apiForm.append("image[]",photo,photo.name||"photo.jpg");
    apiForm.append("prompt",prompts[style]||prompts.cartoon);
    apiForm.append("quality","high");
    apiForm.append("size","1024x1024");

    const response=await fetch("https://api.openai.com/v1/images/edits",{
     method:"POST",
     headers:{Authorization:"Bearer "+env.OPENAI_API_KEY},
     body:apiForm
    });

    const result=await response.json();

    if(!response.ok){
     return Response.json({
      error:result.error?.message||"AI generation failed"
     },{status:response.status});
    }

    return Response.json({image:result.data?.[0]?.b64_json});

   }catch(error){
    return Response.json({error:error.message},{status:500});
   }
  }

  if(url.pathname!=="/" && url.pathname!=="/index.html"){
   return new Response("Not found",{status:404});
  }

  return new Response(PAGE,{
   headers:{"Content-Type":"text/html;charset=UTF-8"}
  });
 }
};
