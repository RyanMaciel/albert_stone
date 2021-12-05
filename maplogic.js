
L.Map.addInitHook(function(){
  window.lmap = this;
})
function run_map_logic(map){
  var current_layers = []
  var map_ready = false;
  function create_map(){
    map.setView([43.156320, -77.608953], 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: "pk.eyJ1Ijoicm1hY2llbCIsImEiOiJja3Z3emxveXA1ejRtMnRudXUxOG1zYmYxIn0.WVBJnE8gZZ7AEdCbWEVEZA"
    }).addTo(map);
  }

  var slider;
  function create_slider(){
    slider = document.getElementById('slider');
    noUiSlider.create(slider, {
        start: [1900, 1950],
        step:1,
        connect: true,
        range: {
            'min': 1900,
            'max': 1950
        },
        format: {
          from: function(value) {
            return parseInt(value);
          },
          to: function(value) {
            return parseInt(value);
          }
        }
    });
    slider.noUiSlider.on("update", slider_changed)
  }



  function setup_search(){
    console.log(document.getElementById('search_input'));

    // has to be an actual function bc this binding is weird.
    const handle_search = function(){
      const search_string = this.value;
      console.log("Search String: " + search_string);
      current_layers.forEach((layer)=>map.removeLayer(layer))
      populate_map(current_start_date, current_end_date, search_string)

      populate_results("", "", "", search_string);
    }

    document.getElementById('search_input').addEventListener('input', debounce(handle_search));
  }


  var current_start_date = 1900;
  var current_end_date = 1950;
  function populate_map(start_date, end_date, search_string){
    current_start_date = start_date;
    current_end_date = end_date;
    for(const acc_num in loader_out_total){
      entry = loader_out_total[acc_num];
      let coords = entry["coordinates"];
      
      // Get number from date
      let entry_date = parseInt(entry["Date made"].replace(/\D/g, ""))
      let passes_date_filter = (entry_date > start_date && entry_date < end_date);

      // Search using the passed search string (still pass seach if the search string is undefined or "")
      let passes_search = !search_string || search_string.length == 0 ||
        entry_in_contains([entry["result_title"], entry["Description"], entry["Notes"]], search_string)

      let address = entry["address"] ? entry["address"] : "";
      let location_names = entry["location_names"] && entry["location_names"].length > 0 ? entry["location_names"] : []
      if (coords && coords.length==2 && passes_date_filter && passes_search){
        const click_func = bind_acc_num_to_click_event(acc_num, address, location_names)
        var marker = L.marker([coords[0], coords[1]])
        marker.addTo(map).on("click", click_func);
        current_layers.push(marker);
        const new_url = old_url_to_new(entry["image_url"]);
        marker.bindPopup("<b><img class=\"popover_img\"src=\"" + new_url + "\">" + acc_num + "</b>")
      }
    }
  }

  function slider_changed(values){
    let date_range_text = document.getElementById("date_range");
    // update text
    date_range_text.innerHTML = `${values[0]} - ${values[1]}`;
    if(map_ready){
      current_layers.forEach((layer)=>map.removeLayer(layer))
      current_layers = [];
      populate_map(values[0], values[1]);
    }
  }

  /** UTILS SECTION  -- helps deal with some of the more frequent
   * string and array comparisons we need. 
   */

  // Given array of strings, check if entry is contained by any of them.
  function entry_in_contains(arr, q){
    if(!arr) return false;
    var result = false;
    arr.forEach((e)=>{
      if(lower_contains(e, q)) result = true;
    })
    return result;
  }
  
  // Case-insensitive check if string1 contains string2.
  function lower_contains(string1, string2){
    if(!string1 || !string2) return false;
    return string1 && string2 && string1.toLowerCase().indexOf(string2.toLowerCase()) != -1;
  }
  function entry_in_eq(arr, entry){
    if(!arr) return false;
    var result = false;
    arr.forEach((e)=>{
      if(lower_equals(e, entry)) result = true;
    })
    return result;
  }
  function lower_equals(string1, string2){
    if(!string1 || !string2) return false;
    return string1 && string2 && string1.toLowerCase() == string2.toLowerCase();
  }

  // Debounce for searching
  // source: https://davidwalsh.name/javascript-debounce-function
  function debounce(func, wait=250, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };


  function populate_results(acc_num, address, location_names, search_string){
    let card_html = ""
    cards_string = "";
    if(acc_num){
      cards_string += card_for_acc_num(acc_num);
    }
    if(address.length > 0){
      for(const curr_acc_num in loader_out_total){
        if(lower_equals(loader_out_total[curr_acc_num]["address"], address) && curr_acc_num != acc_num){
          cards_string += card_for_acc_num(curr_acc_num)
        }
      }
    }
    if(location_names.length > 0){
      location_names.forEach((location_name)=>{
        for(const curr_acc_num in loader_out_total){
          if(entry_in_eq(loader_out_total[curr_acc_num]["location_names"], location_name) && curr_acc_num != acc_num){
            cards_string += card_for_acc_num(curr_acc_num)
          }
        } 
      });
    }

    if(search_string && search_string.length > 0){

      // Search the titles, descriptions and notes for the search string.
      for(const curr_acc_num in loader_out_total){
        const current_entry = loader_out_total[curr_acc_num];
        const search_areas = [current_entry["result_title"], current_entry["Description"], current_entry["Notes"]];
        if(entry_in_contains(search_areas, search_string)){
            cards_string += card_for_acc_num(curr_acc_num)
          }
      }
    }
    
    card_html = `<div>${cards_string}</div>`;

    
    document.getElementById("card_holder").innerHTML = card_html;
  }

  function bind_acc_num_to_click_event(acc_num, address, location_names){
    return ()=>populate_results(acc_num, address, location_names);
  }

  function add_initial_layers(){
    populate_map(1900, 1950);
  }
  create_map();
  create_slider();
  setup_search();
  add_initial_layers();
  setTimeout(()=>map_ready=true,1000)
  setTimeout(setup_search,1000)

}

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

var loaded = false;
window.addEventListener('DOMContentLoaded', (event) => {
  if(!loaded){
    console.log('DOM fully loaded and parsed');
    var mymap = L.map('map');
    loaded = true
    run_map_logic(window.lmap);
  }
});

