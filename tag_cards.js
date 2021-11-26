function card_for_acc_num(acc_num){
  const keys_to_ignore = ["image_url", "local_filename", "Materials", "Collection", "Category", "Maker", "Credits", "Names"];

  const entry = loader_out_total[acc_num];

  // Filter out the entries we are not interested in.
  entry_keys = Object.keys(entry).filter((val)=>keys_to_ignore.indexOf(val) == -1)

  const rows = entry_keys.map((key)=>{
    if(typeof entry[key] == "string" && key && entry[key]){
      return `<div><span class="row_title"><b><u>${key}:</u></b> </span><span>${entry[key]}</span></div>`
    } else {return '';}
  }).reduce((a, b)=>a + b);

  const img = `<img class="card_image" src="${entry["image_url"]}"/>`
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