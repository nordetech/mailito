/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Accounts: {
      name: string
      type: "sst.aws.Dynamo"
    }
    Database: {
      name: string
      type: "sst.aws.Dynamo"
    }
  }
}
export {}