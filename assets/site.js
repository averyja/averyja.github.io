(function () {
  "use strict";
  var content = window.AVERY_LAB_CONTENT || {};
  var lab = content.lab || {};
  var publications = [];

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  function cleanBibText(value) {
    return String(value || "").replace(/[{}]/g,"").replace(/\\&/g,"&").replace(/\\_/g,"_").replace(/\\textendash\s*/g,"–").replace(/--/g,"–").replace(/\\[a-zA-Z]+\s*/g,"").replace(/\s+/g," ").trim();
  }
  function setText(id,value){var el=document.getElementById(id);if(el&&value)el.textContent=value}

  function applyLabContent(){
    setText("hero-eyebrow",lab.eyebrow);setText("hero-title",lab.headline);setText("hero-introduction",lab.introduction);
    setText("contact-affiliation",lab.affiliation);setText("contact-address",lab.address);setText("contact-email-text",lab.email);setText("current-year",new Date().getFullYear());
    var logo=document.getElementById("lab-logo");if(logo&&lab.logo){logo.src=lab.logo;logo.alt=lab.logoAlt||"The Avery Lab logo"}
    ["scholar-link","all-scholar-link"].forEach(function(id){var link=document.getElementById(id);if(link&&lab.scholar){link.href=lab.scholar;link.target="_blank";link.rel="noopener noreferrer"}});
    ["contact-email","contact-email-text"].forEach(function(id){var link=document.getElementById(id);if(link&&lab.email)link.href="mailto:"+lab.email});
  }

  function renderResearch(){
    var grid=document.getElementById("research-grid");if(!grid)return;
    grid.innerHTML=(content.research||[]).map(function(item,index){
      var tags=(item.methods||[]).map(function(tag){return "<span>"+escapeHTML(tag)+"</span>"}).join("");
      return '<article class="research-card reveal" data-delay="'+(index%2)+'" data-accent="'+escapeHTML(item.accent||"berry")+'">'+
        '<div class="research-card-header"><span>'+escapeHTML(item.label)+'</span><span>'+escapeHTML(item.number)+'</span></div><h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.description)+'</p><div class="tag-list" aria-label="Methods and topics">'+tags+'</div></article>';
    }).join("");
  }

  function renderPeople(){
    var grid=document.getElementById("people-grid");if(!grid)return;
    grid.innerHTML=(content.people||[]).map(function(person,index){
      var links=(person.links||[]).map(function(link){var external=/^https?:/i.test(link[1]);return '<a href="'+escapeHTML(link[1])+'"'+(external?' target="_blank" rel="noopener noreferrer"':'')+'>'+escapeHTML(link[0])+(external?' <span aria-hidden="true">↗</span>':'')+'</a>'}).join("");
      return '<article class="person-card reveal" data-delay="'+(index%2)+'"><div class="person-image"><img src="'+escapeHTML(person.image)+'" alt="'+escapeHTML(person.alt||person.name)+'" loading="lazy" /></div><div class="person-copy"><h3>'+escapeHTML(person.name)+'</h3><p class="person-role">'+escapeHTML(person.role)+'</p><p class="person-bio">'+escapeHTML(person.bio)+'</p><div class="person-links">'+links+'</div></div></article>';
    }).join("");
  }

  function parseBibFields(body){
    var fields={},i=0;
    function skip(){while(i<body.length&&/[\s,]/.test(body[i]))i++}
    while(i<body.length){skip();var start=i;while(i<body.length&&/[A-Za-z0-9_-]/.test(body[i]))i++;var key=body.slice(start,i).toLowerCase();if(!key){i++;continue}while(i<body.length&&/\s/.test(body[i]))i++;if(body[i]!=="=")continue;i++;while(i<body.length&&/\s/.test(body[i]))i++;
      var value="";
      if(body[i]==="{"){var depth=1,braceStart=++i;while(i<body.length&&depth>0){if(body[i]==="{")depth++;if(body[i]==="}")depth--;i++}value=body.slice(braceStart,i-1)}
      else if(body[i]==='"'){var quoteStart=++i,escaped=false;while(i<body.length){if(body[i]==='"'&&!escaped)break;escaped=body[i]==="\\"&&!escaped;if(body[i]!=="\\")escaped=false;i++}value=body.slice(quoteStart,i);i++}
      else{var bareStart=i;while(i<body.length&&body[i]!==",")i++;value=body.slice(bareStart,i)}
      fields[key]=cleanBibText(value);
    }
    return fields;
  }

  function parseBibtex(source){
    var entries=[],i=0;
    while(i<source.length){var at=source.indexOf("@",i);if(at<0)break;i=at+1;var typeStart=i;while(i<source.length&&/[A-Za-z]/.test(source[i]))i++;var type=source.slice(typeStart,i).toLowerCase();while(i<source.length&&/\s/.test(source[i]))i++;if(source[i]!=="{"&&source[i]!=="(")continue;var open=source[i],close=open==="{"?"}":")";i++;var keyStart=i;while(i<source.length&&source[i]!==",")i++;var key=source.slice(keyStart,i).trim();if(!key||i>=source.length)continue;i++;var bodyStart=i,depth=1,inQuote=false,escaped=false;
      while(i<source.length&&depth>0){var ch=source[i];if(ch==='"'&&!escaped)inQuote=!inQuote;if(!inQuote){if(ch===open)depth++;if(ch===close)depth--}escaped=ch==="\\"&&!escaped;if(ch!=="\\")escaped=false;i++}
      entries.push(Object.assign({key:key,type:type},parseBibFields(source.slice(bodyStart,i-1))));
    }
    return entries;
  }

  function initials(value){return cleanBibText(value).split(/[\s-]+/).filter(Boolean).map(function(part){return part.charAt(0).toUpperCase()}).join("")}
  function shortAuthorName(author){var cleaned=cleanBibText(author);if(!cleaned)return"";if(/\bothers\b/i.test(cleaned))return"et al.";if(cleaned.indexOf(",")>=0){var parts=cleaned.split(",");return parts[0].trim()+" "+initials(parts.slice(1).join(" "))}var words=cleaned.split(/\s+/).filter(Boolean);if(words.length===1)return words[0];return words[words.length-1]+" "+initials(words.slice(0,-1).join(" "))}
  function formattedAuthors(entry,compact){var authors=String(entry.author||"").split(/\s+and\s+/i).map(shortAuthorName).filter(Boolean);if(compact&&authors.length>7)authors=authors.slice(0,6).concat("et al.");return authors.map(function(author){var safe=escapeHTML(author);return /^Avery\s+J/i.test(author)?'<span class="author-me">'+safe+'</span>':safe}).join(", ")}

  function inferTopic(entry){var text=[entry.title,entry.journal,entry.booktitle,entry.key].join(" ").toLowerCase();if(/e-cig|cigarette|nicotine|tobacco|substance|addiction|puff/.test(text))return"substance-use";if(/depress|autis|anorex|psychiatr|mental health|disorder/.test(text))return"mental-health";if(/interocept|visceral|homeosta|heartbeat|insula functional organization/.test(text))return"interoception";if(/reward|pleasant|appetite|hedonic|self-control|valuation|choice|impuls/.test(text))return"reward";if(/taste|gustat|food|diet|flavor|obesity|metaphor/.test(text))return"taste-food";return"methods"}
  function topicLabel(topic){return{"taste-food":"Taste & food",interoception:"Interoception",reward:"Reward & decisions","mental-health":"Mental health","substance-use":"Substance use",methods:"Methods"}[topic]||"Research"}
  function publicationURL(entry){var configured=content.publicationLinks&&content.publicationLinks[entry.key];if(configured)return configured;if(entry.doi)return/^https?:/i.test(entry.doi)?entry.doi:"https://doi.org/"+entry.doi;if(entry.url)return entry.url;return""}
  function venue(entry){return cleanBibText(entry.journal||entry.booktitle||entry.publisher||"")}
  function citationDetails(entry){var result=venue(entry),details="";if(entry.volume)details+=entry.volume;if(entry.number)details+="("+entry.number+")";if(entry.pages)details+=(details?", ":"")+cleanBibText(entry.pages);if(details)result+=(result?" · ":"")+details;return result}
  function normalizePublication(entry){entry.title=cleanBibText(entry.title);var match=String(entry.year||entry.date||"").match(/\d{4}/);entry.year=match?match[0]:"";entry.topic=inferTopic(entry);entry.searchText=[entry.title,entry.author,venue(entry),entry.year,topicLabel(entry.topic)].join(" ").toLowerCase();return entry}

  function renderFeatured(){
    var grid=document.getElementById("featured-grid"),section=document.getElementById("featured-publications");if(!grid||!section)return;
    var featured=(content.featuredPublicationKeys||[]).map(function(key){return publications.find(function(entry){return entry.key===key})}).filter(Boolean);if(!featured.length){section.hidden=true;return}
    grid.innerHTML=featured.map(function(entry){var url=publicationURL(entry);return '<article class="featured-card"><div class="featured-card-top"><span>'+escapeHTML(entry.year)+'</span><span class="topic-pill" data-topic="'+escapeHTML(entry.topic)+'">'+escapeHTML(topicLabel(entry.topic))+'</span></div><h4>'+escapeHTML(entry.title)+'</h4><div class="authors">'+formattedAuthors(entry,true)+'</div><div class="journal">'+escapeHTML(venue(entry))+'</div>'+(url?'<a class="publication-link" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">Read paper <span aria-hidden="true">↗</span></a>':'')+'</article>'}).join("");
  }

  function publicationItem(entry){var url=publicationURL(entry),kind=/psyarxiv|biorxiv|medrxiv|arxiv/i.test(venue(entry))||entry.type==="misc"?"Preprint":entry.type==="inproceedings"?"Conference paper":"Journal article";return '<article class="publication-item"><div><span class="topic-pill" data-topic="'+escapeHTML(entry.topic)+'">'+escapeHTML(topicLabel(entry.topic))+'</span><h4>'+escapeHTML(entry.title)+'</h4><div class="authors">'+formattedAuthors(entry,false)+'</div><p class="citation">'+escapeHTML(citationDetails(entry))+'</p></div><div class="publication-item-aside"><span>'+kind+'</span>'+(url?'<a class="publication-link" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">DOI / article <span aria-hidden="true">↗</span></a>':'')+'</div></article>'}

  function populateYearFilter(){var select=document.getElementById("year-filter");if(!select)return;var years=publications.map(function(entry){return entry.year}).filter(Boolean).filter(function(year,index,all){return all.indexOf(year)===index}).sort(function(a,b){return Number(b)-Number(a)});select.innerHTML='<option value="all">All years</option>'+years.map(function(year){return '<option value="'+escapeHTML(year)+'">'+escapeHTML(year)+'</option>'}).join("")}

  function renderPublicationResults(){
    var results=document.getElementById("publication-results"),count=document.getElementById("publication-count"),search=document.getElementById("publication-search"),topic=document.getElementById("topic-filter"),year=document.getElementById("year-filter"),sort=document.getElementById("sort-publications");if(!results||!count)return;
    var query=search?search.value.toLowerCase().trim():"",selectedTopic=topic?topic.value:"all",selectedYear=year?year.value:"all",sortMode=sort?sort.value:"newest";
    var filtered=publications.filter(function(entry){return(!query||entry.searchText.indexOf(query)>=0)&&(selectedTopic==="all"||entry.topic===selectedTopic)&&(selectedYear==="all"||entry.year===selectedYear)});
    filtered.sort(function(a,b){if(sortMode==="title")return a.title.localeCompare(b.title);var delta=Number(a.year||0)-Number(b.year||0);return sortMode==="oldest"?delta||a.title.localeCompare(b.title):-delta||a.title.localeCompare(b.title)});
    count.textContent=filtered.length+(filtered.length===1?" publication":" publications")+(filtered.length!==publications.length?" shown":"");
    if(!filtered.length){results.innerHTML='<p class="empty-state">No publications match those filters. Try a broader search or reset the browser.</p>';return}
    var groups={},groupOrder=[];filtered.forEach(function(entry){var key=sortMode==="title"?entry.title.charAt(0).toUpperCase():entry.year||"Other";if(!groups[key]){groups[key]=[];groupOrder.push(key)}groups[key].push(entry)});
    results.innerHTML=groupOrder.map(function(group){var id=group.replace(/[^A-Za-z0-9]/g,"");return '<section class="year-group" aria-labelledby="group-'+escapeHTML(id)+'"><h3 id="group-'+escapeHTML(id)+'">'+escapeHTML(group)+'</h3><div class="year-publications">'+groups[group].map(publicationItem).join("")+'</div></section>'}).join("");
  }

  function wirePublicationControls(){["publication-search","topic-filter","year-filter","sort-publications"].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener(el.tagName==="INPUT"?"input":"change",renderPublicationResults)});var reset=document.getElementById("reset-publications");if(reset)reset.addEventListener("click",function(){var search=document.getElementById("publication-search"),topic=document.getElementById("topic-filter"),year=document.getElementById("year-filter"),sort=document.getElementById("sort-publications");if(search)search.value="";if(topic)topic.value="all";if(year)year.value="all";if(sort)sort.value="newest";renderPublicationResults();if(search)search.focus()})}

  function renderPublications(text){publications=parseBibtex(text).filter(function(entry){return entry.title&&(entry.year||entry.date)&&!/thank you to our .*reviewers/i.test(entry.title)}).map(normalizePublication);if(!publications.length)throw new Error("No publications found");populateYearFilter();renderFeatured();renderPublicationResults()}
  function publicationLoadError(){var featured=document.getElementById("featured-publications"),results=document.getElementById("publication-results"),count=document.getElementById("publication-count");if(featured)featured.hidden=true;if(count)count.textContent="Publication list unavailable";if(results)results.innerHTML='<p class="error-state">The publication file could not be loaded. The full record remains available on <a href="'+escapeHTML(lab.scholar||"#")+'" target="_blank" rel="noopener noreferrer">Google Scholar</a>.</p>'}
  function loadPublications(){var embedded=window.AVERY_LAB_PUBLICATIONS_BIB;if(embedded){try{renderPublications(embedded);return}catch(error){console.warn("Embedded publication data could not be parsed.",error)}}fetch("publications.bib",{cache:"no-store"}).then(function(response){if(!response.ok)throw new Error("Publication file not found");return response.text()}).then(renderPublications).catch(publicationLoadError)}

  function wireNavigation(){
    var header=document.getElementById("site-header"),menuButton=document.getElementById("menu-button"),nav=document.getElementById("primary-nav"),navLinks=nav?Array.prototype.slice.call(nav.querySelectorAll("a[data-section]")):[];
    function closeMenu(){if(!nav||!menuButton)return;nav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");document.body.classList.remove("menu-open")}
    if(menuButton&&nav){menuButton.addEventListener("click",function(){var opening=!nav.classList.contains("open");nav.classList.toggle("open",opening);menuButton.setAttribute("aria-expanded",String(opening));document.body.classList.toggle("menu-open",opening)});navLinks.forEach(function(link){link.addEventListener("click",closeMenu)});window.addEventListener("keydown",function(event){if(event.key==="Escape")closeMenu()});window.addEventListener("resize",function(){if(window.innerWidth>860)closeMenu()})}
    function updateHeader(){if(header)header.classList.toggle("scrolled",window.scrollY>14)}updateHeader();window.addEventListener("scroll",updateHeader,{passive:true});
    if("IntersectionObserver" in window){var observer=new IntersectionObserver(function(entries){var visible=entries.filter(function(entry){return entry.isIntersecting}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio})[0];if(!visible)return;navLinks.forEach(function(link){var active=link.getAttribute("data-section")===visible.target.id;link.classList.toggle("active",active);if(active)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current")})},{rootMargin:"-25% 0px -62% 0px",threshold:[0,.1,.5]});document.querySelectorAll(".section-anchor").forEach(function(section){observer.observe(section)})}
  }

  function initializeReveals(){var items=Array.prototype.slice.call(document.querySelectorAll(".reveal"));if(!("IntersectionObserver" in window)||window.matchMedia("(prefers-reduced-motion: reduce)").matches){items.forEach(function(item){item.classList.add("visible")});return}var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;entry.target.classList.add("visible");observer.unobserve(entry.target)})},{threshold:.08,rootMargin:"0px 0px -45px 0px"});items.forEach(function(item){observer.observe(item)})}

  applyLabContent();renderResearch();renderPeople();wirePublicationControls();wireNavigation();initializeReveals();loadPublications();
})();
