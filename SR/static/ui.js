
function on_recap_checked(e) {
    enable_buttons();
}
function disable_buttons() {
    $("#submit-button").prop("disabled", true);
    $("#download-button").prop("disabled", true);
}
function enable_buttons() {
    $("#submit-button").prop("disabled", false);
    $("#download-button").prop("disabled", false);
}

$(function (){
    var g_expires = 365;
    var g_reload_recap = false;
    var recaptcha_js = "https://www.recaptcha.net/recaptcha/api.js";

    function clear_file() {
        $("#file").val("");
    }
    function clear_url() {
        $("#url").val("");
    }
    function on_change_style(e) {
        var checked = $("input[name=style]:checked");
        if (checked.val() != "photo") {
            $(".main-title").text("waifu2x");
        } else {
            $(".main-title").html("w<s>/a/</s>ifu2x");
        }
        $.cookie("style", checked.val(), {expires: g_expires});
    }
    function on_change_noise_level(e)
    {
        var checked = $("input[name=noise]:checked");
        $.cookie("noise", checked.val(), {expires: g_expires});
    }
    function on_change_scale_factor(e)
    {
        var checked = $("input[name=scale]:checked");
        $.cookie("scale", checked.val(), {expires: g_expires});
    }
    function on_change_format(e)
    {
        var checked = $("input[name=format]:checked");
        $.cookie("format", checked.val(), {expires: g_expires});
    }
    function commit_recap_response()
    {
        if (typeof grecaptcha != "undefined") {
            console.log("recaptcha: enabled")
            $("#recap_response").val(grecaptcha.getResponse());
            grecaptcha.reset();
            disable_buttons();
        } else {
            console.log("recaptcha: disabled")
        }
    }
    function restore_from_cookie()
    {
        if ($.cookie("style")) {
            $("input[name=style]").filter("[value=" + $.cookie("style") + "]").prop("checked", true);
        }
        if ($.cookie("noise")) {
            $("input[name=noise]").filter("[value=" + $.cookie("noise") + "]").prop("checked", true);
        }
        if ($.cookie("scale")) {
            $("input[name=scale]").filter("[value=" + $.cookie("scale") + "]").prop("checked", true);
        }
        if ($.cookie("format")) {
            $("input[name=format]").filter("[value=" + $.cookie("format") + "]").prop("checked", true);
        }
    }
    function uuid() 
    {
        // ref: http://stackoverflow.com/a/2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    function extract_filename(disposition, default_val)
    {
        if (disposition && disposition.indexOf('filename') != -1) {
            var reg = /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i;
            var matches = reg.exec(disposition);
            if (matches && matches.length >= 4 && matches[3]) {
                return decodeURI(matches[3]);
            }
        }
        return default_val;
    }
    
    var imageContainer = document.getElementById('imageContainer');
    var imageElement = imageContainer.querySelector('img');
    // function downloadImage() {
    //     var imageUrl = imageElement.src; // 替换为你的图片 URL
    //     var form = document.createElement('form');
    //     form.method = 'POST';
    //     form.action = imageUrl;
    //     form.style.display = 'none';
    //     document.body.appendChild(form);
    //     form.submit();
    //   }
      function downloadImage() {
        var img = document.getElementById('result-img'); // 获取要下载的图片
        var url = img.src;                                // 获取图片地址
        var a = document.createElement('a');              // 创建一个a节点插入的document
        var event = new MouseEvent('click')               // 模拟鼠标click点击事件
        a.download = '结果图'                       // 设置a节点的download属性值,图片名称
        a.href = url;                                     // 将图片的src赋值给a节点的href
        a.dispatchEvent(event);
    }

      
      
            
    function download_with_xhr(e) 
    {
        if (typeof window.URL.createObjectURL == "undefined" ||
            typeof window.Blob == "undefined" ||
            typeof window.XMLHttpRequest == "undefined" ||
            typeof window.URL.revokeObjectURL == "undefined")
        {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api', true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
            if (this.status == 200) {
                var blob = new Blob([this.response], {type : 'image/png'});
                var a = document.createElement("a");
                var url = URL.createObjectURL(blob);
                a.href = url;
                a.target = "_blank";
                a.download = extract_filename(this.getResponseHeader("Content-Disposition"), uuid() + ".png");
                document.body.appendChild(a);
                a.click();
                setTimeout(function () { URL.revokeObjectURL(url); }, 100);
            } else {
                alert("Download Error");
            }
            check_recaptcha();
        };
        commit_recap_response();
        xhr.send(new FormData($("form").get(0)));
    }

    function check_recaptcha()
    {
        if (g_reload_recap) {
            load_recaptcha();
        }
    }

    function load_recaptcha()
    {
        var state_url = $.cookie("ses_id") ? "/recaptcha_state.json":"/recaptcha_state_static.json";
        console.log(state_url);
        $.ajax({
            url: state_url,
            type: "GET",
            dataType: "json",
        }).done(function (data) {
            var has_power = data.logged_in && data.meter > 0;
            $("#recap_container").empty();
            if (data.enabled && !has_power) {
                // setup recaptcha
                g_reload_recap = false;
                console.log("recaptcha is enabled");
                $("<div>").attr({
                    "class": "g-recaptcha",
                    "data-sitekey": data.site_key,
                    "data-callback": "on_recap_checked"
                }).appendTo("#recap_container");
                $("<script>").attr({
                    type: "text/javascript",
                    src: recaptcha_js
                }).appendTo(document.head);
                disable_buttons();
            } else {
                if (has_power) {
                    g_reload_recap = true;
                    console.log("recaptcha is disabled by power");
                } else {
                    g_reload_recap = false;
                    console.log("recaptcha is disabled");
                }
            }
            $("#login").empty();
            if (!data.error) {
                if (data.logged_in) {
                    $("<meter>").attr({
                        min: 0, 
                        max: data.meter_max,
                        value: data.meter,
                        style: "width: 64px; margin-right: 8px",
                    }).appendTo("#login");
                    $("<a/>", {href: "/logout", text: "Logout"}).appendTo("#login");
                } else {
                    $("<a/>", {href: "/login_with_patreon", text: "Login with Patreon"}).appendTo("#login");
                }
            } else {
                $("<span/>").text("DB Error").appendTo("#login");
            }
        }).fail(function (e) {
            console.log(e)
        });
    }
    function set_param()
    {
        var uri = URI(window.location.href);
        var url = uri.query(true)["url"];
        var style = uri.query(true)["style"];
        var noise = uri.query(true)["noise"];
        var scale = uri.query(true)["scale"];
        var format = uri.query(true)["format"];
        if (url) {
            $("input[name=url]").val(url);
        }
        if (style) {
            $("input[name=style]").filter("[value=" + style + "]").prop("checked", true);
        }
        if (noise) {
            $("input[name=noise]").filter("[value=" + noise + "]").prop("checked", true);
        }
        if (scale) {
            $("input[name=scale]").filter("[value=" + scale + "]").prop("checked", true);
        }
        if (format) {
            $("input[name=format]").filter("[value=" + format + "]").prop("checked", true);
        }
    }
    $("#url").change(clear_file);
    $("#file").change(clear_url);
    $("input[name=style]").change(on_change_style);
    $("input[name=noise]").change(on_change_noise_level);
    $("input[name=scale]").change(on_change_scale_factor);
    $("input[name=format]").change(on_change_format);
    $("input[name=download]").click(download_with_xhr);
    $("form").submit(function(e) {
        e.preventDefault();
        commit_recap_response();
        this.submit();
        check_recaptcha();
    });
    $(document).on({
        dragover: function() { return false; },
        drop: function(e) {
            if (!(e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length)) {
                return false;
            }
            var file = e.originalEvent.dataTransfer;
            if (file.files.length > 0 && file.files[0].type.match(/image/)) {
                var files = new DataTransfer();
                files.items.add(file.files[0]);
                $("#file").get(0).files = files.files;
                $("#file").trigger("change");
                return false;
            } else {
                return false;
            }
        }
    });

    restore_from_cookie();
    on_change_style();
    on_change_scale_factor();
    on_change_noise_level();
    on_change_format();
    set_param();
    load_recaptcha();
})
