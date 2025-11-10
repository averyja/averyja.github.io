<script>
// --- Auto-generate Publications from publications.bib (optional) ---
(function(){
  var pubListEl = document.getElementById('pubList');
  var search = document.getElementById('pubSearch');
  var yearSel = document.getElementById('pubYear');

  function getItems(){
    return Array.prototype.slice.call(document.querySelectorAll('#pubList .pub'));
  }
  function htmlEscape(s){
    s = s || '';
    return s.replace(/[&<>\"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});
  }
  function formatAuthors(authStr){
    authStr = authStr || '';
    var parts = authStr.split(/\s+and\s+/i).map(function(s){return s.trim();}).filter(function(s){return s.length;});
    if(parts.length===0) return '';
    if(parts.length===1) return parts[0];
    if(parts.length===2) return parts[0] + ', ' + parts[1];
    return parts.slice(0,-1).join(', ') + ', ' + parts[parts.length-1];
  }
  function entryToHTML(e){
    var year = e.year || '';
    var title = e.title || '';
    var authors = formatAuthors(e.author || e.authors || '');
    var venue = e.journal || e.booktitle || e.publisher || '';
    var vol = e.volume ? String(e.volume) : '';
    var num = e.number ? '('+e.number+')' : '';
    var pages = e.pages ? String(e.pages) : '';
    var detailsA = (vol+num).replace(/^\s+|\s+$/g,'');
    var details = [];
    if(detailsA) details.push(detailsA);
    if(pages) details.push(pages);
    details = details.join(', ');
    var doiUrl = e.doi ? ('https://doi.org/' + e.doi.replace(/^https?:\/\/doi.org\//,'')) : '';
    var url = (e.url && !doiUrl) ? e.url : '';
    var smallBits = [];
    if(doiUrl) smallBits.push('<a href="'+htmlEscape(doiUrl)+'" target="_blank" rel="noopener">doi</a>');
    if(url) smallBits.push('<a href="'+htmlEscape(url)+'" target="_blank" rel="noopener">link</a>');
    var small = smallBits.length ? ' <small>(' + smallBits.join(' · ') + ')</small>' : '';
    var dataText = (authors+' '+year+' '+title+' '+venue+' '+vol+' '+num+' '+pages).replace(/\s+/g,' ').trim();
    var html = '';
    html += '<article class="card pub" data-year="'+htmlEscape(year)+'" data-text="'+htmlEscape(dataText)+'">';
    html += '<strong>'+htmlEscape(authors)+'</strong>' + (year? ' ('+htmlEscape(year)+').' : '') + ' ';
    html += '<strong>'+htmlEscape(title)+'</strong> ' + (venue? '<em>'+htmlEscape(venue)+'</em>.' : '') + ' ' + htmlEscape(details) + small;
    html += '</article>';
    return html;
  }
  function parseBibtex(text){
    var entries = [];
    var parts = text.split(/\n@/); for(var i=1;i<parts.length;i++){parts[i]='@'+parts[i];}
    for(var j=0;j<parts.length;j++){
      var p = parts[j];
      var m = p.match(/^@(\w+)\s*\{\s*[^,]*,([\s\S]*?)\}\s*$/m);
      if(!m) continue;
      var body = m[2];
      var fields = {};
      var regex = /(\w+)\s*=\s*(\{([^{}]|\{[^{}]*\})*\}|"[^"\\]*(?:\\.[^"\\]*)*")\s*,?/gms;
      var fm;
      while((fm = regex.exec(body))){
        var key = (fm[1]||'').toLowerCase();
        var val = (fm[2]||'').trim();
        if(val.charAt(0)==='{') val = val.slice(1,-1);
        if(val.charAt(0)==='"') val = val.slice(1,-1);
        val = val.replace(/\{\\&\}/g,'&').replace(/\{([^{}]+)\}/g,'$1');
        fields[key] = val.trim();
      }
      if(Object.keys(fields).length){ entries.push(fields); }
    }
    return entries;
  }
  function buildYearDropdown(){
    if(!yearSel) return;
    var years = {};
    getItems().forEach(function(el){ if(el.dataset.year){ years[el.dataset.year]=true; }});
    var list = Object.keys(years).sort(function(a,b){return Number(b)-Number(a);});
    var html = '<option value="">All years</option>';
    for(var i=0;i<list.length;i++){ html += '<option>'+list[i]+'</option>'; }
    yearSel.innerHTML = html;
  }
  function updatePubs(){
    var items = getItems();
    var q = (search && search.value ? search.value : '').toLowerCase().trim();
    var y = (yearSel && yearSel.value ? yearSel.value : '').trim();
    var shown = 0;
    for(var i=0;i<items.length;i++){
      var el = items[i];
      var matchText = ((el.dataset.text || el.textContent || '')).toLowerCase();
      var matchYear = (y==='') || (el.dataset.year === y);
      var matchQuery = (q==='') || (matchText.indexOf(q) !== -1);
      var visible = matchYear && matchQuery;
      el.style.display = visible ? 'block' : 'none';
      if(visible) shown++;
    }
    var empty = document.getElementById('noPubs');
    if(shown===0){
      if(!empty){
        empty = document.createElement('div');
        empty.id = 'noPubs';
        empty.className='card';
        empty.style.padding='16px';
        empty.textContent = 'No publications match your filters.';
        pubListEl.appendChild(empty);
      }
    } else if(empty){
      empty.parentNode && empty.parentNode.removeChild(empty);
    }
  }
  function initSearch(){
    if(search) search.addEventListener('input', updatePubs);
    if(yearSel) yearSel.addEventListener('change', updatePubs);
    buildYearDropdown();
    updatePubs();
  }
  async function tryLoadBib(){
    try{
      var res = await fetch('publications.bib', {cache:'no-store'});
      if(!res.ok) { initSearch(); return; }
      var text = await res.text();
      var entries = parseBibtex(text).filter(function(e){ return e.title && (e.year || e.date); });
      for(var i=0;i<entries.length;i++){
        if(!entries[i].year && entries[i].date){
          var yy = (entries[i].date.match(/\d{4}/)||[])[0];
          if(yy) entries[i].year = yy;
        }
      }
      entries.sort(function(a,b){ return Number(b.year||0) - Number(a.year||0); });
      var html = '';
      for(var k=0;k<entries.length;k++) html += entryToHTML(entries[k]);
      if(html){ pubListEl.innerHTML = html; }
      initSearch();
    }catch(err){
      console.warn('BibTeX load failed:', err);
      initSearch();
    }
  }
  // Kick off
  tryLoadBib();
})();
// --- End BibTeX loader ---
</script>
