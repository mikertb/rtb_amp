;(function($){
    var config = {
        url : "http://hooks.rtb.cat:8000/info/inventory",
        loading: false,
        last_data: null,
        sellers: [
            {id:181,link:"google"},
            {id:357,link:"openx"},
            {id:459,link:"rubicon"},
            {id:1752,link:"smaato"},
            {id:280,link:"microsoft"}
        ]
    }
    var data = {countries:[],items:[],page:{current:1,total:0}};
    var obj = {
        $page_country_title: $('#selected_country_title'),
        $form: $('#search_form'),
        $th: $('#table_container th'),
        $tbody: $('#table_container tbody'),
        $sort_box: $('.pagination select.sorting'),
        $order_box: $('.pagination select.ordering'),
        $prev_btn: $('.pagination .btn-prev'),
        $next_btn: $('.pagination .btn-next'),
        $page_tot: $('.pagination .page-total'),
        $page_num: $('.pagination select.page-number'),
        $search_icon: $('#search_icon'),
        $search_modal: $('#search_modal'),
        $search_modal_close: $('#search_modal button[role="cancel"]'),
        $country_selected: $('#filter_country_choice'),
        $country_modal: $('#country_modal'),
        $country_modal_options: $('#country_modal li[data-code]'),
        $country_modal_close: $('#country_modal button[role="cancel"]')
    };
    function init(){
        obj.$form.on('submit',update);
        obj.$form.find('input[name="country"]').on('click',getCountry);
        obj.$search_icon.on('click',function(){obj.$search_modal.addClass('active');});
        obj.$search_modal_close.on('click',function(){obj.$search_modal.removeClass('active');});
        obj.$page_num.on('change',setPage);
        obj.$prev_btn.on('click',prevPage);
        obj.$next_btn.on('click',nextPage);
        obj.$country_modal_options.on('click',setCountry);
        obj.$country_modal_close.on('click',function(){obj.$country_modal.removeClass('active');});
        obj.$th.on('click',sortColumn);
        $('#loader').css('display','block');
        $.ajax({
            method: "GET",
            url: "http://rtb.cat/files/countries_jvector_map.json",
            success: function(response){
                var countries = eval(response);
                for(var i=0;i<countries.length;i++){
                    data.countries[countries[i].code] = countries[i].name;
                }
                putCountryList();
                // Check for query string with specific country.
                var country_query = location.search;
                var country_match = country_query.match(/country=([A-Z]{2})/);
                try {
                    var country_found = country_match[1];
                } catch(e) {
                    var country_found = null;
                }
                if(country_found !== null) {
                    var country_name = data.countries[country_found];
                    if(country_name.length > 2){
                        obj.$form.find('[name="country"]').prop('checked',false);
                        $('#filter_country_single').val(country_found).prop('checked',true);
                        $('#filter_country_choice').text(country_name);
                    }
                }
                update();
            }
        });
    }
    function render(){
        // Loading status.
        if(config.loading){
            $('#loader').css('display','block');

        }else{
            $('#loader').css('display','none');
        }
        // Update page title for selected country.
        var country_name = "All Countries";
        var country_value = obj.$form.find('input[name="country"]:checked').val();
        if(country_value != "all"){
            country_name = $('#country_modal [data-code="'+country_value+'"]').text();
        }
        obj.$page_country_title.text(country_name);
        // Update table entries.
        var entries = '';
        if(data.items.length > 0){
            for(var i=0;i<data.items.length;i++){
                var item = data.items[i];
                var seller_link = "";
                for(var j=0;j<config.sellers.length;j++){
                    var seller = config.sellers[j];
                    if(item.seller_member_id == seller.id){
                        seller_link = seller.link;
                    }
                }
                if(seller_link != ""){
                    entries += '<tr><td><a onclick="displayMap(event)" data-seller="'+seller_link+'">'+item.seller_member_name+'</a></td><td>'+formatNumber(item.filtered_imps)+'</td></tr>';
                }else{
                    entries += '<tr><td>'+item.seller_member_name+'</td><td>'+formatNumber(item.filtered_imps)+'</td></tr>';
                }
            }
            obj.$prev_btn.prop('disabled',false);
            obj.$page_num.prop('disabled',false);
            obj.$next_btn.prop('disabled',false);
        }
        else{
            entries = '<tr><td colspan="2">No entries found.</td></tr>';
            obj.$prev_btn.prop('disabled',true);
            obj.$page_num.prop('disabled',true);
            obj.$next_btn.prop('disabled',true);
        }
        obj.$tbody.html(entries);
        //Update pagination.
        var pages = '';
        if(data.page.current > 1){
            obj.$prev_btn.prop('disabled',false);
        }else{
            obj.$prev_btn.prop('disabled',true);
        }
        if(data.page.total > 1){
            for(var i=0;i<data.page.total;i++){
                var n = i+1;
                pages += '<option value="'+n+'">'+n+'</option>';
            }
        }else{
            pages = '<option value="1">1</option>';
        }
        obj.$page_tot.text(data.page.total);
        obj.$page_num.html(pages);
        obj.$page_num.val(data.page.current);
        if(data.page.current < data.page.total){
            obj.$next_btn.prop('disabled',false);
        }else{
            obj.$next_btn.prop('disabled',true);
        }
    }
    function update(e){
        obj.$search_modal.removeClass('active');
        if(e){if(e.target.nodeName == "FORM") e.preventDefault();}
        var new_data = obj.$form.serialize();
        if(config.last_data != new_data){
            config.loading = true;
            render();
            $('html, body').animate({scrollTop: 0}, 300);
            $.ajax({
                method: "GET",
                url: config.url,
                data: new_data,
                success: function(response){
                    data.items = response.items;
                    data.page = response.page;
                    config.loading = false;
                    config.last_data = new_data;
                    render();
                }
            });
        }
    }
    function sortBy(e){
        var sort_input = obj.$form.find('input[name="sort_by"]');
        var order_input = obj.$form.find('input[name="order_by"]');
        var th = $('#table_container th[data-sort="'+e.target.value+'"]');

        var new_sort = e.target.value;
        var new_order = order_input.val();

        obj.$th.removeClass('active asc des').addClass('sort');
        th.removeClass('sort').addClass('active '+new_order);
        sort_input.val(new_sort);
        obj.$sort_box.val(new_sort);
        update();
    }
    function orderBy(e){
        var order_input = obj.$form.find('input[name="order_by"]');
        var sort_input = obj.$form.find('input[name="sort_by"]');
        var th = $('#table_container th[data-sort="'+sort_input.val()+'"]');
        var new_order = e.target.value;

        obj.$th.removeClass('active asc des').addClass('sort');
        th.removeClass('sort').addClass('active '+new_order);
        order_input.val(new_order);
        obj.$order_box.val(new_order);
        update();
    }
    function prevPage(e){
        if(data.page.current > 1){
            var current_page = obj.$form.find('input[name="page"]');
            current_page.val(Number(current_page.val())-1);
            update();
        }
    }
    function setPage(e){
        var page_number = e.target.value;
        obj.$form.find('input[name="page"]').val(page_number);
        obj.$page_num.val(page_number)
        update();
    }
    function nextPage(e){
        if(data.page.current < data.page.total){
            var current_page = obj.$form.find('input[name="page"]');
            current_page.val(Number(current_page.val())+1);
            update();
        }
    }
    function putCountryList(){
        var html = "";
        for(var code in data.countries){
            html += '<li data-code="'+code+'">'+data.countries[code]+'</li>';
        }
        $('#country_modal .list').html(html);
        $('#country_modal .list li').on('click',setCountry);
    }
    function getCountry(e){
        if(e.target.value == "all"){
            $('#filter_country_single').val("");
            obj.$country_selected.text("Select Country");
            obj.$page_country_title.text("All Countries");
        }else{
            e.preventDefault();
            obj.$country_modal.addClass('active');
        }
    }
    function setCountry(e){
        var country_code = $(e.target).attr('data-code');
        var country_name = $(e.target).text();
        obj.$country_selected.text(country_name);
        obj.$form.find('input[name="country"]').prop('checked',false);
        $('#filter_country_single').val(country_code).prop('checked',true);
        obj.$country_modal.removeClass('active');
    }
    function sortColumn(e){
        var sort_input = obj.$form.find('input[name="sort_by"]');
        var order_input = obj.$form.find('input[name="order_by"]');
        var column = (e.target.nodeName === "TH")? $(e.target) : $(e.target).parents("th");
        var new_sort = column.attr('data-sort');
        var new_order = (order_input.val() === "asc")? "des" : "asc";
        obj.$th.removeClass('active asc des').addClass('sort');
        column.removeClass('sort').addClass('active '+new_order);
        sort_input.val(new_sort);
        order_input.val(new_order);
        obj.$sort_box.val(new_sort);
        obj.$order_box.val(new_order);
        update();
    }
    function formatNumber(n){return Number(n).toLocaleString('en-US')}
    // Initialize app.
    $(document).ready(init);
}(jQuery))
;(function($){
    function goFullScreen(id) {
        var el = document.getElementById(id);
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }
    function exitFullScreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    function displayMap(e){
        var seller = $(e.target).attr('data-seller');
        var name = $(e.target).text();
        var url = "http://sandbox.lat.com.es/index.php/stat/json?seller="+seller;
        var obj = $('#world_map_modal');
        var box = $('#world_map_modal .box');
        var map = $('#world_map_modal .jvectormap-container');
        var leg = $('#world_map_modal .map-title');
        var fsb = $('#world_map_modal .scr-toggle');
        var ldr = $('#loader');
        // Functions.
        var closeAll = function(e){
            var target = $(e.target);
            if(e.target.nodeName === "DIV"){
                if(target.hasClass('screen-overlay')){
                    box.removeClass('open');
                    setTimeout(function(){target.css('display','none')},300);
                }
            }
            if(e.target.nodeName === "I"){
                if(target.hasClass('glyphicon-remove')){
                    if(obj.hasClass('fullscreened')){
                        obj.removeClass('fullscreened');
                        fsb.removeClass("restore").addClass("max").attr("title","Fullscreen");
                        exitFullScreen();
                        setTimeout(function(){box.removeClass('open');},200);
                        setTimeout(function(){obj.css('display','none')},500);
                    }else{
                        box.removeClass('open')
                        setTimeout(function(){obj.css('display','none')},300);
                    }
                }
            }
        }
        var toggleFS = function(e){
            if(obj.hasClass('fullscreened')){
                obj.removeClass('fullscreened');
                $(this).removeClass("restore").addClass("max").attr("title","Fullscreen");
                exitFullScreen();
            }else{
                obj.addClass('fullscreened');
                $(this).addClass("restore").removeClass("max").attr("title","Exit fullscreen");
                goFullScreen('world_map_modal');
            }
        }
        // Prep view.
        box.removeClass('open');
        ldr.css('display','block');
        // Bind events
        obj.unbind('click').on('click',closeAll);
        fsb.unbind('click').on('click',toggleFS);
        // Ajax call.
        if(seller.length > 0){
            leg.text("");
            $.getJSON(url, function(data){
                map.remove();
                ldr.css('display','none');
                obj.css('display','block');
                leg.text(name);
                setTimeout(function(){
                    box.addClass('open')
                    .vectorMap({
                        map: 'world_mill',
                        backgroundColor: '#f5f5f5',
                        series: {
                            regions: [{values: data, scale: ['#9bd62c', '#cc2129'], normalizeFunction: 'polynomial'}]
                        },
                        onRegionTipShow: function(e, el, code){
                            el.html(el.html()+' = '+parseInt(data[code]).toLocaleString());
                        }
                    });
                },100);
            });
        }else{console.log("No seller provided.");}
    };
    window.displayMap = displayMap;
}(jQuery));

;(function($){
    var obj = {
        $side_bar: $('#side_bar'),
        $side_bar_toggle: $('#side_bar .toggle-icon')
    }
    function init(){
        obj.$side_bar_toggle.on('click',toggleSidebar);
    }
    function toggleSidebar(e){
        if(obj.$side_bar.hasClass('toggled')){
            obj.$side_bar.removeClass('toggled');
        }else{
            obj.$side_bar.addClass('toggled');
        }
        console.log("Toggle triggered.");
    }
    init();
}(jQuery))
