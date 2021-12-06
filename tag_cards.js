// The RMSC catalog serves http only, this archive can serve from
// https, fixing mixed content blocking.
function old_url_to_new(old_url){
  var base_url = "https://photo.libraryweb.org/rochimag/rmsc/scm";

  // pull out <2 digit num>/scm<num>.jpg
  const matches = old_url.match(/([0-9]{2}\/.*.jpg)/gi);
  if(matches && matches.length>0){
    base_url += matches[0]
  } else {
    return old_url;
  }
  return base_url;
}

function normalize_entry(entry){
  // Shallow copy.
  const copy_entry = Object.assign({}, entry);
  // Fix name of entry, get rid of brackets
  copy_entry["Result Title"] = copy_entry["result_title"].replace("[", "").replace("]", "");
  delete copy_entry["result_title"]
  
  // Capitalize "address"
  if(copy_entry["address"]){
    copy_entry["Address"] = copy_entry["address"];
    delete copy_entry["address"];
  }

  // Fix order of negative num, it parses weird
  for(let key in copy_entry){
    if(copy_entry[key].indexOf("Stone neg. number") != -1 && key != "Notes"){
      copy_entry["Stone Negative Number"] = key;
      delete copy_entry[key];
    }
  }

  // Get rid of keys not needed for display.
  const keys_to_ignore = ["image_url", "local_filename", "Materials", "Collection", "Category", "Maker"];

  keys_to_ignore.forEach((key)=>delete copy_entry[key]);

  return copy_entry;
}

function card_for_acc_num(acc_num){

  entry = loader_out_total[acc_num];
  display_entry = normalize_entry(entry);
  
  // Filter out the entries we are not interested in.
  ordered_entry_keys = ["Result Title", "Description", "Notes", "Date made", "Subject(s)", "Names", "Address", "Acc. No.", "Stone Negative Number", "Measurements", "Credits"]

  let rows = ordered_entry_keys.map((key)=>{
    if(typeof display_entry[key] == "string" && key && display_entry[key]){
      return `<div><span class="row_title"><b><u>${key}:</u></b> </span><span>${display_entry[key]}</span></div>`
    } else {return '';}
  }).reduce((a, b)=>a + b);

  // Label entry as not located if we don't have coords.
  if(!entry["coordinates"]){
    rows += `<div><span><b>Please note this entry has not yet been geolocated and will only appear in search.</b></span></div>`
  }
  const img_url = old_url_to_new(entry["image_url"])
  const img = `<img class="card_image" src="${img_url}"/>`
  return `<div class="image_card">${img}${rows}</div>`
}

window.addEventListener('DOMContentLoaded', (event) => {

  const card_elements = document.getElementsByClassName("dynamic_image_card");
  console.log(card_elements)
  for(element of card_elements){
    console.log(element);
    let acc_num = element.getAttribute("accNum");
    if(acc_num && acc_num != ""){
      element.innerHTML = card_for_acc_num(acc_num)
    }
  }
});