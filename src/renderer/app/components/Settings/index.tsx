import * as React from 'react';
import { observer } from 'mobx-react';

import store from '../../store';
import { InputField, ExtLink } from './style'
import { Button } from '~/renderer/components/Button';
import { Sections, Image, SettingsSection, ListItem, StyledNavigationDrawerItem, NavDILine_Profile, Title, Buttons, A, AboutWrapper, SettingsItem, TitleEmail } from './style';
import BookmarkC from '../Bookmark';
import { Bookmark } from '../../models/bookmark';
import { icons } from '../../constants';
import { NavigationDrawer } from '../NavigationDrawer';
import { ContextMenu, ContextMenuItem } from '../ContextMenu';
import { Content, Container, Scrollable } from '../Overlay/style';
import { SelectionDialog } from '../SelectionDialog';
import { preventHiding } from '../Overlay';
import console = require('console');
import Switch from '@material-ui/core/Switch';
import OptSwitch from '../Switch';
import { resolve } from 'path';
import { platform, homedir } from 'os';
import { DropArrow, IconButton } from '../Overlay/style';
import { notify } from 'node-notifier';
import { ipcRenderer, ipcMain, shell } from 'electron';
import RPCSwitch from '../SettingsToggles/RichPresenceToggle';
const DataURI = require('datauri').promise;

var modal = require('electron-modal');
const { remote } = require('electron')
const { Tray, app } = remote
const editJsonFile = require("edit-json-file");
let file = editJsonFile(resolve(homedir()) + '/dot/dot-options.json');

const scrollRef = React.createRef<HTMLDivElement>();

var win = remote.getCurrentWindow();
win.webContents.session.clearCache(function(){
  
});

const onBackClick = () => {
  scrollRef.current.scrollTop = 0;
  document.getElementById("search-engine-dp").style.opacity = "0";
  document.getElementById("search-engine-dp").style.pointerEvents = "none";
  store.bookmarks.menuVisible = false;
};

const onScroll = (e: any) => {
  const scrollPos = e.target.scrollTop;
  const scrollMax = e.target.scrollHeight - e.target.clientHeight - 256;
};

const onInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  
};

const logout = async () => {
  store.user.loggedin = false;
  store.user.username = "Guest";
  store.user.avatar = icons.user
  store.user.email = null;
  localStorage.removeItem("dot_footprint")
}

const login = async () => {
  var si = await modal.open(resolve(app.getAppPath() + '\\static\\pages\\sign-in.html'), {
    width: 400,
    height: 600,
    resizable: false,
    center: false,
    alwaysOnTop: false,
    title: store.locale.uk.settings[0].my_profile[0].sign_in_btn,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true
    },
    frame: false
  })

  si.on('passed-details', (c: any) => {
    store.user.username = c.customname;
    store.user.avatar = c.avatar;

    console.log(store.user.avatar + ' ' + c.avatar)

    store.user.email = c.email;
    store.user.loggedin = true;

    localStorage.setItem("dot_footprint", Buffer.from(c.email + '||' + c.password).toString('base64'));

    si.hide();
  });

  si.on('load-external-url', (c: any) => {
    var url = c;
    store.tabs.addTab({ url, active: true });

    setTimeout(function() {
      store.overlay.visible = false;
    }, 250);
  });

  si.show();
  
  si.on('show', () => {
    var div = document.getElementById('settings'),
    divChildren = div.childNodes;
  
    for (var i=0; i<divChildren.length; i++) {
      divChildren[i].style.filter = "blur(5px)";
      divChildren[i].style.pointerEvents = "none";
    }

  });

  si.on('closed', () => {

    app.focus()

    var div = document.getElementById('settings'),
    divChildren = div.childNodes;

    for (var i=0; i<divChildren.length; i++) {
      divChildren[i].style.filter = null;
      divChildren[i].style.pointerEvents = null;
    }

    si = null;

  })

  si.on('hide', () => {

    app.focus()

    var div = document.getElementById('settings'),
    divChildren = div.childNodes;

    for (var i=0; i<divChildren.length; i++) {
      divChildren[i].style.filter = null;
      divChildren[i].style.pointerEvents = null;
    }

    si = null;
  })  


}

const onMouse = () => {
  if(store.user.loggedin == true) {
    document.getElementById("user-avatar").style.filter = "brightness(70%)";
  }
};

const offMouse = () => {
  if(store.user.loggedin == true) {
    document.getElementById("user-avatar").style.filter = null
  }
};

const pickAvatar = () => {
  if(store.user.loggedin == true) {
    document.getElementById("avatar-choose").click();
  }
};

const Email = observer(() => {
  if(store.user.loggedin == true) {
    return (
      <TitleEmail visible={false} style={{ fontSize: 16, marginLeft: '4px', marginTop: '-20px' }}>{store.user.email}</TitleEmail>
    );
  }
  else {
    return (
      <TitleEmail visible={true} style={{ fontSize: 16, marginLeft: '4px' }}>{store.user.email}</TitleEmail>
    );    
  }
});

function avatarTitle() {
  if(store.user.loggedin == true) {
    return "Upload a new avatar"
  }
  else {
    return "";
  }
}

const formSubmit = () => {
  return false;
}

const YourProfile = observer(() => {
  var user = {
    username: 'Guest',
    avatar: icons.user,
    email: '.'
  };

  var shouldInvert = 'invert(100%)';
  var shouldBr = '0';

  if(store.user.loggedin == true) {
    user.username = store.user.username
    user.avatar = store.user.avatar
    user.email = store.user.email
    shouldInvert = 'invert(0%)';
    shouldBr = '50%';
  }
  else {

  }
  return (
    <SettingsSection id="my-profile">
      <ListItem>
        <form encType="multipart/form-data" method="post" name="fileinfo">
          <input id="avatar-choose" onChange={avatarChange} accept="image/png" name="avatar" type="file" style={{ display: 'none' }}></input>
        </form>
        <Image src={store.user.avatar} id="user-avatar" title={avatarTitle()} onClick={pickAvatar} onMouseOver={onMouse} onMouseOut={offMouse} style={{ filter: `${shouldInvert}`, borderRadius: `${shouldBr}`, width: '45px', marginLeft: '-12px', transition: 'filter 0.3s' }}></Image>
        <div style={{ marginTop: '-7px' }}>
          <Title style={{ fontSize: 25, marginLeft: '4px' }}>{user.username}</Title>
          <Email />
        </div>
        <Buttons style={{ marginLeft: 'auto' }}>
          <Button onClick={login} visible={store.user.loggedin == false} style={{ backgroundColor: 'transparent', color: '#fff' }}>
            {store.locale.uk.settings[0].my_profile[0].sign_in_btn}
          </Button>
          <Button onClick={logout} visible={store.user.loggedin == true} style={{ backgroundColor: 'transparent', color: '#fff' }}>
            {store.locale.uk.settings[0].my_profile[0].sign_out_btn}
          </Button>
        </Buttons>
      </ListItem>
    </SettingsSection>
  );
});

async function avatarChange() {

  var files = document.getElementById('avatar-choose').files[0];

  if(files.type == "image/png") {
    if(files.size / 1024 / 1024 <= 2) {

      var content = await DataURI(files.path);

      store.user.avatar = content

      var form = document.forms.namedItem("fileinfo");
    
        var footprint = atob(localStorage.getItem("dot_footprint"));

        var email = footprint.split("||")[0];
        var password = footprint.split("||")[1];

        var oData = new FormData(form);

        var oReq = new XMLHttpRequest();
        oReq.open("POST", "https://dot.ender.site/api/upload/avatar", true);
        oReq.setRequestHeader("Authorization", `DotUser ${password} at ${email}`)
        oReq.send(oData);
        oReq.onload = function() {
          var body = JSON.parse(oReq.responseText);
        };
  

    }
  }

};

const wexond = () => {
  var url = "https://github.com/wexond/wexond"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const enderdev = () => {
  var url = "https://github.com/EnderDev"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const geek = () => {
  var url = "https://github.com/GamingGeek"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const func = () => {
  var url = "https://github.com/frostylosty"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const sky = () => {
  var url = "https://github.com/SkyPlayzYT05"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const dtf = () => {
  var url = "https://github.com/DusterTheFirst"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const blz = () => {
  var url = "https://github.com/blizma"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}

const UKFlag = observer(() => {
  return (
    <Image src={icons.uk} style={{ width: '14px' }}></Image>
  )
});

const HeartEmote = observer(() => {
  return (
    <span style={{ color: '#ff4040' }}>❤</span>
  );
});

const chachy = () => {
  var url = "https://github.com/chachyyyy"
  store.tabs.addTab({url, active: true });
  store.overlay.visible = false;
}


const AboutDot = observer(() => {
  return (
    <SettingsSection>
      <ListItem>
        <Image id="maybe-click-the-arrow" onClick={clearSecretBoyo} src={icons.logo} style={{ width: '30px', transition: 'filter 0.2s' }}></Image>
        <Title style={{ fontSize: 20 }}>{store.locale.uk.standard[0].dot_full_with_version.replace(/{appVersion}/g, remote.app.getVersion())}</Title>
        <Buttons style={{ marginLeft: 'auto' }}>
          <A onClick={secretBoyo} style={{ padding: '22px 8px 10px 12px', cursor: 'pointer', transition: 'background-color 0.2s', borderRadius: '50%', marginRight: '-10px' }}>
            <Image src={icons.down} style={{ filter: 'invert(100%)' }}></Image>
          </A>
        </Buttons>
      </ListItem>
      <AboutWrapper id="about-wrapper">
        <Title style={{ fontSize: 14, marginLeft: '40px' }}>{store.locale.uk.settings[0].about_dot[0].thanks_message} <ExtLink onClick={wexond}>Wexond</ExtLink> {store.locale.uk.settings[0].about_dot[0].wxnd_coffee}</Title>
        <Title style={{ fontSize: 14, marginLeft: '40px' }}>{store.locale.uk.settings[0].about_dot[0].made_in} <Image src={icons.uk} style={{ width: '14px' }}></Image>{store.locale.uk.settings[0].about_dot[0].gb_with} <span style={{ color: '#ff4040' }}>❤</span>.</Title>
        <Title style={{ fontSize: 14, marginLeft: '40px', fontWeight: 450 }}>{store.locale.uk.settings[0].about_dot[0].developers_title}</Title>
        <ExtLink onClick={enderdev} title="<endercraftergaming@gmail.com>" style={{ marginLeft: '60px', color: '#dadada' }}>EnderDev</ExtLink>
        <ExtLink onClick={geek} title="<thegaminggeek362@gmail.com>" style={{ marginLeft: '5px', color: '#dadada' }}>Jake Ward</ExtLink>
        <Title style={{ fontSize: 14, marginLeft: '40px', fontWeight: 450 }}>{store.locale.uk.settings[0].about_dot[0].beta_testers_title}</Title>
        <ExtLink onClick={func} title="<oli.loversss@gmail.com>" style={{ marginLeft: '60px', color: '#dadada' }}>Oli</ExtLink>
        <ExtLink onClick={sky} title="<bognonjeremy05@gmail.com>" style={{ color: '#dadada' }}>Jeremy Bognon</ExtLink>
        <ExtLink onClick={blz} title="<blizzyisheres@gmail.com>" style={{ color: '#dadada' }}>Blizma</ExtLink>
        <ExtLink onClick={chachy} title="<shalomadecoolboy@outlook.com>" style={{ color: '#dadada' }}>Chachy</ExtLink>
        <Title style={{ fontSize: 14, marginLeft: '40px', fontWeight: 450 }}>{store.locale.uk.settings[0].about_dot[0].special_thanks_title}</Title>
        <ExtLink onClick={dtf} title="<dusterthefirst@gmail.com>" style={{ marginLeft: '60px', color: '#dadada' }}>Zachary Kohnen</ExtLink>
        <Title style={{ fontSize: 12, marginLeft: '40px', marginTop: '10px', color: '#dadada' }}>{store.locale.uk.settings[0].about_dot[0].verbose_loaded_fcm}</Title>
        <Title style={{ fontSize: 12, marginLeft: '40px', marginTop: '10px', color: '#dadada' }}>{store.locale.uk.settings[0].about_dot[0].copyright_notice}</Title>
      </AboutWrapper>
    </SettingsSection>
  );
});

if(!file.get("downloadLocation")) {
  file.set("downloadLocation", resolve(homedir()) + '\\Downloads');
  file.save()
  var dl = file.get("downloadLocation");
}
else {
  var dl = file.get("downloadLocation");
}

const pickLocation = () => {
  var input = document.getElementById("download-picker");
  input.click();
}

const awaitDownloadUpdate = async () => {
  var input = document.getElementById("download-picker")
  dl = input.files[0].path;

  setTimeout(function() {

    file.set("downloadLocation", dl)
    file.save()
  
    store.downloads.location = dl;
    ipcRenderer.send('set-downloads-loc', `${dl}`);

    document.getElementById("dl-l").innerText = dl;

  }, 300);

}

const Downloads = observer(() => {
  return (
    <SettingsSection>
      <ListItem>
        <div>
          <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].downloads[0].download_loc}</Title>
          <Title id="dl-l" style={{ fontSize: 13, marginTop: '-7px', color: '#a2a2a2' }}>{dl}</Title>
        </div>
        <Buttons style={{ marginLeft: 'auto' }}>
          <IconButton onClick={pickLocation} icon={icons.more} style={{ cursor: 'pointer' }} />
        </Buttons>
        <input onChange={awaitDownloadUpdate} type="file" id="download-picker" style={{ display: 'none' }} webkitdirectory="true" />
      </ListItem>
    </SettingsSection>
  );
});

const Advanced = observer(() => {
  return (
    <SettingsSection>
      <ListItem>
        <Title style={{ fontSize: 15 }}>Show Discord Rich Presence</Title>
        <Buttons style={{ marginLeft: 'auto' }}>
          <RPCSwitch />
        </Buttons>
      </ListItem>
    </SettingsSection>
  );
});


const showProfile = () => {
}

const secretBoyo = () => {
  var x = document.getElementById("about-wrapper");
  if (x.style.display === "none") {
    x.style.display = null;
    document.getElementById("maybe-click-the-arrow").style.filter = ``
  } else {
    x.style.display = "none";
    const eggies = [
      'invert(40%) grayscale(100%) brightness(40%) sepia(100%) hue-rotate(-50deg) saturate(400%) contrast(2)',
      'grayscale(100%) brightness(30%) sepia(100%) hue-rotate(-180deg) saturate(700%) contrast(0.8)',
      'grayscale(100%) brightness(40%) sepia(100%) hue-rotate(50deg) saturate(1000%) contrast(0.8)',
      'grayscale(100%) brightness(222%) sepia(1000%) hue-rotate(6deg) saturate(600%) contrast(1.1)'
    ]
    const egg = eggies[Math.floor(Math.random()*eggies.length)];
    document.getElementById("maybe-click-the-arrow").style.filter = egg;
  }
}

const clearSecretBoyo = () => {
  document.getElementById("maybe-click-the-arrow").style.filter = ``
}

const optionsData = file.get();

class ToggleSwitchDL extends React.Component {
  state = {
    dotLauncherToggle: optionsData.toggleDotLauncher,
    checkedB: true,
  };

  handleChange = (name: any) => (event: any) => {
    this.setState({ [name]: event.target.checked });
    if(name == "dotLauncherToggle") {
      if(optionsData.toggleDotLauncher == true) {
        file.set("toggleDotLauncher", false);
        console.info(`[SettingsStore] Set dotLauncherEnabled to false`)
        file.save();
        document.getElementById("dot").style.display = "none";
      }
      else {
        file.set("toggleDotLauncher", true);
        console.info(`[SettingsStore] Set dotLauncherEnabled to true`)
        file.save();
        document.getElementById("dot").style.opacity = "1";
        document.getElementById("dot").style.pointerEvents = "all";
        document.getElementById("dot").style.width = "auto";
        document.getElementById("dot").style.display = null;
      }
    }
  };

  render() {
    return (
      <Switch
        checked={this.state.dotLauncherToggle}
        onChange={this.handleChange('dotLauncherToggle')}
        value="checkedA"
        color="primary"
      />
    );
  }
}

export default ToggleSwitchDL;

var seMenuVisible = false;

const toggleSeMenu = (e: any) => {
  e.stopPropagation();
  var x = document.getElementById("search-engine-dp")
  if(x.style.opacity == "0") {
    x.style.opacity = "1";
    x.style.pointerEvents = "all";
  }
  else {
    x.style.opacity = "0";
    x.style.pointerEvents = "none";
  }
}

const setEngineGoogle = () => {
  file.set("searchEngine", "google");
  console.info(`[SettingsStore] Set searchEngine to custom string google`)
  file.save(); 
  seMenuVisible = false   
  document.getElementById("ctx-item-g").style.backgroundColor = "#585858c7";
  document.getElementById("ctx-item-b").style.backgroundColor = "";
  document.getElementById("ctx-item-y").style.backgroundColor = "";
  document.getElementById("ctx-item-d").style.backgroundColor = "";
  document.getElementById("ctx-item-e").style.backgroundColor = "";
}

const setEngineBing = () => {
  file.set("searchEngine", "bing");
  console.info(`[SettingsStore] Set searchEngine to custom string bing`)
  file.save();  
  seMenuVisible = false 
  document.getElementById("ctx-item-g").style.backgroundColor = "";
  document.getElementById("ctx-item-b").style.backgroundColor = "#585858c7";
  document.getElementById("ctx-item-y").style.backgroundColor = "";
  document.getElementById("ctx-item-d").style.backgroundColor = "";
  document.getElementById("ctx-item-e").style.backgroundColor = "";
}

const setEngineYahoo = () => {
  file.set("searchEngine", "yahoo");
  console.info(`[SettingsStore] Set searchEngine to custom string yahoo`)
  file.save(); 
  seMenuVisible = false 
  document.getElementById("ctx-item-g").style.backgroundColor = "";
  document.getElementById("ctx-item-b").style.backgroundColor = "";
  document.getElementById("ctx-item-y").style.backgroundColor = "#585858c7";
  document.getElementById("ctx-item-d").style.backgroundColor = "";
  document.getElementById("ctx-item-e").style.backgroundColor = "";
}

const setEngineDdg = () => {
  file.set("searchEngine", "ddg");
  console.info(`[SettingsStore] Set searchEngine to custom string ddg`)
  file.save();    
  seMenuVisible = false
  document.getElementById("ctx-item-g").style.backgroundColor = "";
  document.getElementById("ctx-item-b").style.backgroundColor = "";
  document.getElementById("ctx-item-y").style.backgroundColor = "";
  document.getElementById("ctx-item-d").style.backgroundColor = "#585858c7";
  document.getElementById("ctx-item-e").style.backgroundColor = "";
}

const setEngineEcosia = () => {
  file.set("searchEngine", "ecosia");
  console.info(`[SettingsStore] Set searchEngine to custom string ecosia`)
  file.save();    
  seMenuVisible = false
  document.getElementById("ctx-item-g").style.backgroundColor = "";
  document.getElementById("ctx-item-b").style.backgroundColor = "";
  document.getElementById("ctx-item-y").style.backgroundColor = "";
  document.getElementById("ctx-item-d").style.backgroundColor = "";
  document.getElementById("ctx-item-e").style.backgroundColor = "#585858c7";
}

var se = file.get("searchEngine");
if(se == "google") {
  var cmICG = "#585858c7"
}
if(se == "yahoo") {
  var cmICY = "#585858c7"
}
if(se == "bing") {
  var cmICB = "#585858c7"
}
if(se == "ddg") {
  var cmICD = "#585858c7"
}
if(se == "ecosia") {
  var cmICE = "#585858c7"
}

if(!file.get("tempType")) {
  file.set("tempType", "c");
  document.getElementById("deg-type-cel").style.backgroundColor = "rgba(88, 88, 88, 0.78)";
  file.save()
}

export const setDTC = () => {
  document.getElementById("deg-type-cel").style.backgroundColor = "rgba(88, 88, 88, 0.78)";
  document.getElementById("deg-type-fah").style.backgroundColor = "";

  if(!file.get("tempType")) {
    file.set("tempType", "c")
    file.save()
    store.weather.load("c");
  }
  else {
    file.set("tempType", "c")
    file.save()
    store.weather.load("c");
  }
  
};

export const setDTF = () => {
  document.getElementById("deg-type-fah").style.backgroundColor = "rgba(88, 88, 88, 0.78)";
  document.getElementById("deg-type-cel").style.backgroundColor = "";

  if(!file.get("tempType")) {
    file.set("tempType", "F")
    file.save()
    store.weather.load("F");
  }
  else {
    file.set("tempType", "F")
    file.save()
    store.weather.load("F");
  }
};

var isC = "";
var isF = "";
if(file.get("tempType") == "c") {
  isC = "#585858c7"
}
if(file.get("tempType") == "F") {
  isF = "#585858c7"
}

export const Appearance = observer(() => {
    return (
      <SettingsSection>
        <ListItem>
          <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].appearance[0].toggle_dot}</Title>
          <Buttons style={{ marginLeft: 'auto', marginRight: '-12px' }}>
            <ToggleSwitchDL />
          </Buttons>
        </ListItem>

        <ListItem>
          <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].appearance[0].search_engine}</Title>
          <Buttons style={{ marginLeft: 'auto' }}>
            <DropArrow onClick={toggleSeMenu} style={{ cursor: 'pointer' }} />
            <ContextMenu id="search-engine-dp" visible={seMenuVisible} style={{ top: '450px', marginLeft: '-50px' }}>            
              <ContextMenuItem icon={icons.search} onClick={setEngineGoogle} style={{ backgroundColor: `${cmICG}` }} id="ctx-item-g">
                {store.locale.uk.settings[0].google_searchEngine}
              </ContextMenuItem>
              <ContextMenuItem onClick={setEngineYahoo} icon={icons.search} style={{ backgroundColor: `${cmICY}` }} id="ctx-item-y">
                {store.locale.uk.settings[0].yahoo_searchEngine}
              </ContextMenuItem>
              <ContextMenuItem icon={icons.search} onClick={setEngineBing} style={{ backgroundColor: `${cmICB}` }} id="ctx-item-b">
                {store.locale.uk.settings[0].bing_searchEngine}
              </ContextMenuItem>
              <ContextMenuItem icon={icons.search} onClick={setEngineDdg} style={{ backgroundColor: `${cmICD}` }}  id="ctx-item-d">
                {store.locale.uk.settings[0].ddg_searchEngine}
              </ContextMenuItem>
              <ContextMenuItem icon={icons.search} onClick={setEngineEcosia} style={{ backgroundColor: `${cmICE}` }} id="ctx-item-e">
                {store.locale.uk.settings[0].ecosia_searchEngine}
              </ContextMenuItem>
            </ContextMenu>
          </Buttons>
        </ListItem>

        <ListItem>
          <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].appearance[0].temp_type}</Title>
          <Buttons style={{ marginLeft: 'auto', marginRight: '-17px', display: 'inline-flex' }}>
            <IconButton icon={icons} id="deg-type-cel" onClick={setDTC} style={{ textAlign: 'center', backgroundColor: `${isC}` }}>
              <span style={{ lineHeight: '32px', color: 'black', fontWeight: 900, fontFamily: 'roboto' }}>°C</span>
            </IconButton>
            <IconButton id="deg-type-fah" icon={icons} onClick={setDTF} style={{ textAlign: 'center', backgroundColor: `${isF}` }}>
              <span style={{ lineHeight: '32px', color: 'black', fontWeight: 900, fontFamily: 'roboto' }}>°F</span>
            </IconButton>
          </Buttons>
        </ListItem>

      </SettingsSection>
    );
});

export const openDevTools = () => {
  remote.webContents.getFocusedWebContents().openDevTools({ mode: 'detach' });  
              
  if (remote.webContents.getFocusedWebContents().isDevToolsOpened()) {
    remote.webContents.getFocusedWebContents().devToolsWebContents.focus();
  }
}

export const testNotif = () => {
  notify({
      title: 'Dot',
      appName: "Dot",
      message: 'Testing Notification',
      icon: resolve(app.getAppPath() + '\\static\\icon.png'),
      sound: true,
      wait: true
    },
    function(err: any, response: any) {
      
    }); 
};

const openLog = () => {
  remote.shell.openItem(remote.app.getPath('userData') + '\\dot-errors.log')
}

const MenuItem = observer(
  ({ selected, children, display }: { selected: boolean; children: any; display: any }) => (
    <NavigationDrawer.Item
      selected={selected}
      onClick={() => (store.options.currentDisplay = display)}
    >
      {children}
    </NavigationDrawer.Item>
  ),
);

export const Experiments = observer(() => {
  return (
    <SettingsSection>
      <ListItem>
        <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].dev_tools[0].chromium_dt}</Title>
        <Buttons style={{ marginLeft: 'auto' }}>
          <Button visible={store.user.experiments == true} onClick={openDevTools} style={{ backgroundColor: 'transparent', color: '#fff' }}>
            {store.locale.uk.standard[0].button_open}
          </Button>
        </Buttons>
      </ListItem>
      <ListItem>
        <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].dev_tools[0].send_test_notif}</Title>
        <Buttons style={{ marginLeft: 'auto' }}>
          <Button visible={store.user.experiments == true} onClick={testNotif} style={{ backgroundColor: 'transparent', color: '#fff' }}>
            {store.locale.uk.standard[0].button_run}
          </Button>
        </Buttons>
      </ListItem>
      <ListItem>
        <Title style={{ fontSize: 15 }}>{store.locale.uk.settings[0].dev_tools[0].open_log}</Title>
        <Buttons style={{ marginLeft: 'auto' }}>
          <Button visible={store.user.experiments == true} onClick={openLog} style={{ backgroundColor: 'transparent', color: '#fff' }}>
            {store.locale.uk.standard[0].button_run}
          </Button>
        </Buttons>
      </ListItem>
    </SettingsSection>
  );
});

export const scrollMp = () => {
  document.getElementById("my-profile").scrollTop = 0;
}

export const Settings = observer(() => {
  return (
    <Container
      onClick={preventHiding}
      right
      id="settings"
      visible={
        store.overlay.currentContent === 'settings' && store.overlay.visible
      }
    >
      <Scrollable onScroll={onScroll} ref={scrollRef} style={{ transition: 'filter 0.2s' }}>
        <NavigationDrawer
          title={store.locale.uk.settings[0].title}
          onBackClick={onBackClick}
          search
          onSearchInput={onInput}
        >
          <MenuItem selected={true} display="profile">{store.locale.uk.settings[0].my_profile[0].title}</MenuItem>
          <MenuItem selected={false} display="appearance">{store.locale.uk.settings[0].appearance[0].title}</MenuItem>
          <MenuItem selected={false} display="downloads">{store.locale.uk.settings[0].downloads[0].title}</MenuItem>
        </NavigationDrawer>
        <Sections>
          <Content>
              <Title style={{ margin: '75px -30px -25px -30px' }}>{store.locale.uk.settings[0].my_profile[0].title}</Title>
              <YourProfile />

              <Title style={{ margin: '75px -30px -25px -30px' }}>{store.locale.uk.settings[0].appearance[0].title}</Title>
              <Appearance />

              <Title style={{ margin: '75px -30px -25px -30px' }}>{store.locale.uk.settings[0].downloads[0].title}</Title>
              <Downloads />

              {store.user.experiments == true && <Title style={{ margin: '75px -30px -25px -30px' }}>{store.locale.uk.settings[0].dev_tools[0].title}</Title>}
              {store.user.experiments == true && <Experiments />}

              <Title style={{ margin: '75px -30px -25px -30px' }}>{store.locale.uk.settings[0].about_dot[0].title}</Title>
              <AboutDot />

          </Content>
        </Sections>
      </Scrollable>
    </Container>
  );
});
