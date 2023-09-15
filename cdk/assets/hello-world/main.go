package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
)

func handler(context context.Context, event interface{}) (string, error) {

	return "hello world", nil

}

func main() {
	lambda.Start(handler)
}
