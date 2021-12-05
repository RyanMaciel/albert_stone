
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
    document.getElementById('search_input').addEventListener('input', function() {
      search_string = this.value;
      console.log(search_string);
      current_layers.forEach((layer)=>map.removeLayer(layer))
      populate_map(current_start_date, current_end_date, search_string)
    });
  }

  function string_in_lower(str1, str2) {
    return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
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
      let passes_search = !search_string || search_string.length == 0
        || string_in_lower(entry["result_title"], search_string)
        || string_in_lower(entry["Description"], search_string)
        || string_in_lower(entry["Notes"], search_string)

      let address = entry["address"] ? entry["address"] : "";
      let location_names = entry["location_names"] && entry["location_names"].length > 0 ? entry["location_names"] : []
      if (coords && coords.length==2 && passes_date_filter && passes_search){
        const click_func = bind_acc_num_to_click_event(acc_num, address, location_names)
        var marker = L.marker([coords[0], coords[1]])
        marker.addTo(map).on("click", click_func);
        current_layers.push(marker);
        marker.bindPopup("<b><img class=\"popover_img\"src=\"" + entry["image_url"] + "\">" + acc_num + "</b>")
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

  function entry_in(arr, entry){
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
  function marker_click(acc_num, address, location_names){
    let card_html = ""
    cards_string = card_for_acc_num(acc_num);
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
          if(entry_in(loader_out_total[curr_acc_num]["location_names"], location_name) && curr_acc_num != acc_num){
            cards_string += card_for_acc_num(curr_acc_num)
          }
        } 
      });
    }
    
    card_html = `<div>${cards_string}</div>`;

    
    document.getElementById("card_holder").innerHTML = card_html;
  }

  function bind_acc_num_to_click_event(acc_num, address, location_names){
    return ()=>marker_click(acc_num, address, location_names);
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

function card_for_acc_num(acc_num){
  const keys_to_ignore = ["image_url", "local_filename", "Materials", "Collection", "Category", "Maker", "Credits", "Names"];

  entry = loader_out_total[acc_num];

  // Filter out the entries we are not interested in.
  entry_keys = Object.keys(entry).filter((val)=>keys_to_ignore.indexOf(val) == -1)

  const rows = entry_keys.map((key)=>{
    if(typeof entry[key] == "string" && key && entry[key]){
      return `<div><span class="row_title"><b><u>${key}:</u></b> </span><span>${entry[key]}</span></div>`
    } else {return '';}
  }).reduce((a, b)=>a + b);

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

