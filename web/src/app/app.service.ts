import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private apiUrl = 'http://localhost:3000'
  constructor(private _httpClient: HttpClient) { }

  getNonce(walletAddress: string) {
    return this._httpClient.get<{ nonce: string, walletAddress: string }>(`${this.apiUrl}/${walletAddress}/nonce`)
  }

  login(walletAddress: string, signature: string, type: string) {
    return this._httpClient.post<{ accessToken: string, refreshToken: string }>(`${this.apiUrl}/login/${type}`, { walletAddress, signature })
  }
}
