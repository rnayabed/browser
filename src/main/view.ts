import { BrowserView, app, ContextMenuParams, ipcRenderer } from "electron";
import { resolve } from "path";
import { appWindow } from ".";
import { NAVIGATION_HEIGHT } from "../renderer/app/constants/window";
import { getGeneralMenu } from "./menus/general";
import { downloadFaviconFromUrl } from "./tools/favicon";
import { BLUE_1, GRAY_5 } from "../renderer/constants/colors";
import { NEWTAB_URL } from "../renderer/constants/web";
import { createView } from "./tools/view";

export class View {
    public view: BrowserView;
    public id: string;

    constructor(id: string, url: any) {
        this.id = id;

        this.view = new BrowserView({
            webPreferences: {
                sandbox: true,
                preload: resolve(app.getAppPath(), "build", "preload.bundle.js"),
                nodeIntegration: false,
                additionalArguments: [`--tab-id=${id}`],
                contextIsolation: true,
                partition: 'persist:view',
                scrollBounce: true
            }
        })

        this.view.setBackgroundColor("#fff");

        this.view.webContents.on('did-start-loading', (_e) => {
            appWindow.window.webContents.send('view-created', { id, url })
        })

        this.view.webContents.userAgent =
          this.view.webContents.userAgent
          .replace(/ dot\\?.([^\s]+)/g, '')
          .replace(/ Electron\\?.([^\s]+)/g, '')
          .replace(/Chrome\\?.([^\s]+)/g, `Chrome/81.0.4044.122`)

        this.view.setAutoResize({ width: true, height: true, horizontal: false, vertical: false });
        this.view.webContents.loadURL(url);

        this.view.webContents.on('context-menu', (_event, params: ContextMenuParams) => {
            const { x, y } = params;

            const id = this.id;

            const generalMenu = getGeneralMenu(id)

            generalMenu.popup({ x, y: y + NAVIGATION_HEIGHT })
        })

        this.view.webContents.on('did-navigate', this.events.viewNavigate)
        this.view.webContents.on('did-navigate-in-page', this.events.viewNavigateInPage)
        this.view.webContents.on('did-start-loading', this.events.viewStartedLoading)
        this.view.webContents.on('did-stop-loading', this.events.viewStoppedLoading)

        this.view.webContents.on('new-window', this.events.viewWindowOpened)

        this.view.webContents.on('page-title-updated', this.events.viewTitleUpdated)
        this.view.webContents.on('page-favicon-updated', this.events.viewFaviconUpdated)
        this.view.webContents.on('did-change-theme-color', this.events.viewThemeColorUpdated)
    }

    public rearrange() {
        let { width, height } = appWindow.window.getBounds()
    
        if(appWindow.window.isMaximized()) {
            width = width - 15
            height = height - 15
        }

        this.view.setBounds({ x: 0, y: NAVIGATION_HEIGHT, width, height: height - NAVIGATION_HEIGHT });
    }

    private get events() {
        return {
            viewNavigate: (_event: Electron.Event, url: string, httpResponseCode: number, httpStatusText: string) => {
                appWindow.window.webContents.send(`view-data-updated-${this.id}`, { url })

                this.updateNavigationButtons()
            },
            viewNavigateInPage: (_event: Electron.Event, url: string, isMainFrame: boolean) => {
                if(isMainFrame) {
                    appWindow.window.webContents.send(`view-data-updated-${this.id}`, { url })

                    this.updateNavigationButtons()
                }
            },
            viewStartedLoading: (_event: Electron.Event) => {
                appWindow.window.webContents.send(`view-data-updated-${this.id}`, { status: 'loading' })

                this.updateNavigationButtons()
            },
            viewStoppedLoading: (_event: Electron.Event) => {
                appWindow.window.webContents.send(`view-data-updated-${this.id}`, { status: 'idle' })

                this.updateNavigationButtons()
            },
            viewWindowOpened: (
                _event: Electron.Event,
                url: string, 
                frameName: string, 
                disposition: "new-window" | "default" | "foreground-tab" | "background-tab" | "save-to-disk" | "other", 
                options: Electron.BrowserWindowConstructorOptions, 
                additionalFeatures: string[], 
                referrer: Electron.Referrer
            ) => {
                _event.preventDefault()

                if(disposition == "foreground-tab" || disposition == "background-tab") {
                    appWindow.window.webContents.send('add-tab', { url, active: disposition == "foreground-tab" })
                }
            },
            viewTitleUpdated: (_event: Electron.Event, title: string) => {
                appWindow.window.webContents.send(`view-data-updated-${this.id}`, { title })

                this.updateNavigationButtons()
            },
            viewFaviconUpdated: (_event: Electron.Event, favicons: any[]) => {
                if(this.url === NEWTAB_URL) return;
                const faviconUrl = favicons[0];

                downloadFaviconFromUrl(faviconUrl).then(favicon => {
                    appWindow.window.webContents.send(`view-data-updated-${this.id}`, { favicon })
                })

                this.updateNavigationButtons()
            },
            viewThemeColorUpdated: (_event: Electron.Event, themeColor: any) => {
                if(themeColor == null || this.url == NEWTAB_URL) themeColor = BLUE_1
                appWindow.window.webContents.send(`view-data-updated-${this.id}`, { themeColor })
            }
        }
    }

    private updateNavigationButtons() {
        const canGoForward = this.view.webContents.canGoForward()
        const canGoBack = this.view.webContents.canGoBack()

        appWindow.window.webContents.send(`view-data-updated-${this.id}`, { navigationStatus: { canGoForward, canGoBack } })
    }

    public get url() {
        return this.view.webContents.getURL()
    }
}
