import { Component, OnInit } from '@angular/core';
import { catchError, from, map, Observable, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { AppService } from './app.service';
import Web3 from 'web3';

declare const window: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'web';

  metamaskAvaialble: boolean = false
  phantomAvaialble: boolean = false

  loggedIn$: Observable<boolean>
  walletAddress: string;
  login$ = new Subject<void>()


  loginType: string;

  constructor(private appService: AppService) {

  }

  async ngOnInit() {
    if (typeof window.ethereum !== 'undefined') {
      this.metamaskAvaialble = true
    }

    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        this.phantomAvaialble = true
      }
    }

    this.loggedIn$ = this.login$.pipe(
      switchMap(() => this.appService.getNonce(this.walletAddress)),
      switchMap(({ nonce, walletAddress }) => {

        if (this.loginType === 'metamask') {
          const message = nonce.split('')
            .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');
          return from(window.ethereum.request({
            method: 'personal_sign',
            params: [
              `0x${message}`,
              walletAddress,
            ],
          }))
            .pipe(
              catchError(() => {
                return of(false)
              })
            )
        } else {
          const provider = window.phantom?.solana; 

          const encodedMessage = new TextEncoder().encode(nonce);
          return from(provider.request({
            method: "signMessage",
            params: {
              message: encodedMessage,
              display: "utf8",
            },
          }))
            .pipe(
              map(result => (result as any)?.signature)
            )
        }
      }),
      switchMap((signature) => {
        return this.appService.login(this.walletAddress, `${signature}`, this.loginType)
          .pipe(catchError(() => {
            return of(false)
          }))
      }),
      map((result) => !!result),
      shareReplay(1)
    )

  }

  async connectToMetamask() {
    try {
      this.loginType = 'metamask'
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

      this.walletAddress = accounts[0]
      this.login$.next()
    } catch (error) {
      console.log(error)
    }
  }

  async connectToPhantom() {
    try {
      this.loginType = 'phantom'
      const resp = await window.phantom?.solana.connect();
      this.walletAddress = resp.publicKey.toString();
      this.login$.next()
    } catch (err) {
      console.log(err)
    }
  }
}
