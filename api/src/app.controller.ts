import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import * as nacl from 'tweetnacl'
import * as bs58 from 'bs58'

@Controller()
export class AppController {

  USERS: Map<string, string> = new Map<string, string>()

  constructor() {
  }

  @Get(':walletAddress/nonce')
  async getNonce(
    @Param('walletAddress') walletAddress: string,
  ) {
    try {
      let nonce = this.USERS.get(walletAddress)
      if (!nonce) {
        nonce = `Sign in to the MyProject dashboard ${Math.floor(Math.random() * 1000000).toString()}`
        this.USERS.set(walletAddress, nonce)
      }
      return { nonce, walletAddress }

    } catch (error) {
      throw new BadRequestException()
    }
  }

  @Post('login/:type')
  async generateToken(@Body() body: any, @Param('type') type: string,) {
    try {

      if (!body.walletAddress || !body.signature) {
        throw new BadRequestException();
      }

      let verified = false

      const walletAddress = body.walletAddress;
      const signature = body.signature;

      let nonce = this.USERS.get(walletAddress)
      if (!nonce) {
        throw new BadRequestException();
      }

      if (type === 'metamask') {
        const message = `${nonce}`
          .split('')
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('');


        const recoveredAddress = recoverPersonalSignature({
          data: `0x${message}`,
          signature
        });

        verified = recoveredAddress === walletAddress

      } else {

        const message = new TextEncoder().encode(nonce)
        verified = nacl
          .sign
          .detached
          .verify(message,
            bs58.decode(signature),
            bs58.decode(walletAddress)
          )
      }


      if (verified) {
        return { accessToken: 'demo', refeshToken: 'demo2' }
      } else {
        throw new BadRequestException();
      }

    } catch (e) {
      console.log(e)
      throw new BadRequestException();
    }
  }


}
