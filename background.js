'use strict';

var data  = {}; 
chrome.storage.local.get(['priorityLst'], function (result) {
  var tmpdata = result && result.priorityLst || {};
  data = Array.isArray(tmpdata) ? {"2": tmpdata} : tmpdata;
});

function setPriorty() {

  function toggleRow() {

    var priorityLst = data[gid];
    if(!priorityLst || priorityLst.length == 0) return;

    $('table.outer tr:gt(2) td:first-child a').each(function() {
      var userName = $(this).text().trim();
      var show = priorityLst.includes(userName);
      $(this).parent().parent().toggle(show);
    });
  };

  toggleRow();

  var btn = $('<input type="button" value="優先表示設定">').css({marginLeft: "10px"});
  var updateBtn = $("input[type='submit']:not([name='not_submit'])");
  updateBtn.after(btn);

  var datepicker =  $('<input type="button" value="日付選択" >').css({marginLeft: "10px"});
  btn.after(datepicker);
  
  datepicker.datepicker({onSelect: function(dateText){
    var url = "https://www.tci-cn.co.jp/intra/modules/fischher/weekly.php";
    var strs = dateText.split("/");
    var params = ["?year=" + strs[0], "month=" + strs[1], "day=" + strs[2]].join("&");
    window.location = url + params;
  }, dateFormat : 'yy/m/d', 
  afterShow: function(params) {
    var bgImg = chrome.extension.getURL("jquery-ui-1.12.1.custom/images/ui-icons_444444_256x240.png");
    $(".ui-icon, .ui-widget-content .ui-icon").css({backgroundImage: "url(" + bgImg + ")"})
  }
  });
  btn.after(datepicker);

  var unchkAllBtn = $('<input id="unchkAllBtn" type="button" value="全員チェック外す">').css({marginLeft: "10px"});
  unchkAllBtn.hide();
  btn.after(unchkAllBtn);
  unchkAllBtn.on("click", function(){
    $(":checkbox[name='priorty']").prop("checked", false);
    data[gid] = [];
    chrome.storage.local.set({'priorityLst': data}, function() {});
  });

  var chkAllBtn = $('<input id="unchkAllBtn" type="button" value="全員チェックする">').css({marginLeft: "10px"});
  chkAllBtn.hide();
  unchkAllBtn.after(chkAllBtn);
  chkAllBtn.on("click", function () {
    var priorityLst = [];
    $(":checkbox[name='priorty']").each(function(){
      $(this).prop("checked", true);
      priorityLst.push($(this).next().text().trim());
    });

    data[gid] = priorityLst;
    chrome.storage.local.set({'priorityLst': data}, function() {});
  });

  function showPriority(){
    // chrome.storage.local.get(['priorityLst'], function(result) {
      var priorityLst = data[gid]|| [];
      // priorityLst = result.priorityLst || [];    
      
      $('table.outer tr').show();
      $("table.outer tr:gt(2) td:first-child a").each(function() {
        var userName = $(this).text().trim();
        var chk = $('<input name="priorty" type="checkbox"/>');
        chk.prop('checked', priorityLst.includes(userName)).val(userName);;

        $(this).before(chk);
      });

      btn.one('click', savePriority).val('OK');
      unchkAllBtn.toggle();
      chkAllBtn.toggle();
    // });
  }

  function savePriority() {
    $('table.outer tr:gt(2) td:first-child :checkbox').remove();
    toggleRow();
    btn.one('click', showPriority).val('優先表示設定');
    unchkAllBtn.toggle();
    chkAllBtn.toggle();
  }

  btn.one('click', showPriority);
  
  $("body").on('click', 'input[name=priorty]', function() {
    var priorityLst = [];
    $('input[name=priorty]:checked').each(function() {
      priorityLst.push($(this).val());
    });

    data[gid] = priorityLst;

    chrome.storage.local.set({'priorityLst': data}, function() {
      // console.log('Value is set to ' , priorityLst);
    });
  });
}

var gid  = $('select[name=gid]').val();

function setMemberList() {
  function split( val ) {
    return val.split( /,\s*/ );
  }
  
  function extractLast( term ) {
    return split( term ).pop();
  }

  function removeLabelAndUnselect(obj){
    var lbl = $(this);
    var ltxt = lbl.text().trim();
    memberSel.children("option:selected").each(function(){
      var op = $(this);
      if(ltxt == op.text().trim()) {
        op.prop("selected", false);
      }
    });

    lbl.remove();
  }
  
  function createMemberLabel(text) {
    var iconPath = chrome.extension.getURL("jquery-ui-1.12.1.custom/images/ui-icons_444444_256x240.png");
    return $("<label class='head'>" + text + "<span class='ui-icon ui-icon-circle-close' style='background-image: url(" + iconPath + ");'></span></label>");
  }

  function createMemberLabelAndBindEvent(text) {
    var l = createMemberLabel(text);
    l.on("click", removeLabelAndUnselect);
    searchTxt.before(l);
  }

  var memberSel = $("select[name='member[]']").hide();
  var searchTxt = $("<input placeholder='社員名／社員番号を入力する'>");
  var containerDiv = $("<div>");
  var showMemberChk = $("<span class='head'><input id='memberChk' class='memberChk' type='checkbox'/><label for='memberChk'></label></span>").on("click", 'input', function(){
    memberSel.toggle();
  });
  
  
  memberSel.before(containerDiv.append(searchTxt));
  memberSel.children("option:selected").each(function(){
    createMemberLabelAndBindEvent($(this).text().trim());
  });
  searchTxt.after(showMemberChk);

  var memberLst = [];
  memberSel.children("option").each(function(){
    memberLst.push($(this).text().trim());
  });

  memberSel.on("click", "option", function(){
    containerDiv.find("label.head").remove();
    memberSel.find("option:selected").each(function(){
      createMemberLabelAndBindEvent($(this).text().trim());
    });
  });

  searchTxt.autocomplete({
    source: memberLst,
    source: function( request, response ) {
      response( $.ui.autocomplete.filter(
        memberLst, extractLast( request.term ) ) );
    },
    select: function( event, ui ) {
      memberSel.children("option").each(function(){
        var op = $(this);
        var selected = op.prop("selected");
        if(ui.item.value == op.text().trim()) {
          op.prop("selected", !selected);
          if(!selected) {
            createMemberLabelAndBindEvent(ui.item.value);
          } else {
            containerDiv.find("label.head").each(function(){
              if($(this).text().trim() == ui.item.value) {
                $(this).remove();
              }
            });
          }
        }
      });
      searchTxt.val("");
      return false;
    }
  });

  //時刻
  var starthour = $("select[name='start_hour']");
  var startmin = $("select[name='start_min']");
  var endhour = $("select[name='end_hour']");
  var endmin = $("select[name='end_min']");
  var hyphen = "--";
  
  starthour.on("change", function(params) {
    if(startmin.val() == hyphen) {
      startmin.val("0");
    }
    if(this.value != hyphen) {
      endhour.val(parseInt(this.value) + 1);
      endmin.val("0");
    } else {
      startmin.val(hyphen);
      endhour.val(hyphen);
      endmin.val(hyphen);
    }
  });
}

jQuery(document).ready(function(){

  var pathname = window.location.pathname.split("/").slice(-1).pop();
  if($("#legacy_xoopsform_block_submit").length) return;

  $.datepicker._showDatepicker_original = $.datepicker._showDatepicker;
  $.datepicker._showDatepicker = function(event) {
      $.datepicker._showDatepicker_original(event);
      var inst = $.datepicker._getInst( event.target );

      var afterShow = $.datepicker._get(inst, 'afterShow');
      if (afterShow) {
        afterShow.apply();
      }
  }

  switch (pathname) {
    case "weekly.php":
      setPriorty();
      break;
    case "update.php":
    case "regist.php":
      setMemberList();
    default:
      switch (window.location.pathname) {
        case "/intra/" :
        case "/intra/modules/fischher/" :
        case "/intra/modules/fischher/index.php" :
          setPriorty();
          break;
        default:
          break;
      }
      break;
  }
});

