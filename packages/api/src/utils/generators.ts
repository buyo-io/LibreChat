import fetch from 'node-fetch';
import { logger } from '@librechat/data-schemas';
import { GraphEvents, sleep } from '@librechat/agents';
import type { Response as ServerResponse } from 'express';
import type { ServerSentEvent } from '~/types';
import { sendEvent } from './events';

/**
 * Makes a function to make HTTP request and logs the process.
 * @param params
 * @param params.directEndpoint - Whether to use a direct endpoint.
 * @param params.reverseProxyUrl - The reverse proxy URL to use for the request.
 * @returns A promise that resolves to the response of the fetch request.
 */
export function createFetch({
  directEndpoint = false,
  reverseProxyUrl = '',
  endpoint = '',
}: {
  directEndpoint?: boolean;
  reverseProxyUrl?: string;
  endpoint?: string;
}) {
  /**
   * Makes an HTTP request and logs the process.
   * @param url - The URL to make the request to. Can be a string or a Request object.
   * @param init - Optional init options for the request.
   * @returns A promise that resolves to the response of the fetch request.
   */
  return async function (
    _url: fetch.RequestInfo,
    init: fetch.RequestInit,
  ): Promise<fetch.Response> {
    let url = _url;
    if (directEndpoint) {
      url = reverseProxyUrl;
    }
    const urlStr = typeof url === 'string' ? url : url.toString();
    const endpointLabel = endpoint ? `[${endpoint}] ` : '';
    logger.debug(`${endpointLabel}Making request to ${urlStr}`, {
      method: init?.method || 'GET',
      hasBody: !!init?.body,
    });
    
    const startTime = Date.now();
    let response;
    try {
      if (typeof Bun !== 'undefined') {
        response = await fetch(url, init);
      } else {
        response = await fetch(url, init);
      }
      
      const duration = Date.now() - startTime;
      logger.debug(`${endpointLabel}Response received from ${urlStr}`, {
        status: response.status,
        duration: `${duration}ms`,
        contentType: response.headers.get('content-type'),
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${endpointLabel}Request failed to ${urlStr}`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
      });
      throw error;
    }
  };
}

/**
 * Creates event handlers for stream events that don't capture client references
 * @param res - The response object to send events to
 * @returns Object containing handler functions
 */
export function createStreamEventHandlers(res: ServerResponse) {
  return {
    [GraphEvents.ON_RUN_STEP]: function (event: ServerSentEvent) {
      if (res) {
        sendEvent(res, event);
      }
    },
    [GraphEvents.ON_MESSAGE_DELTA]: function (event: ServerSentEvent) {
      if (res) {
        sendEvent(res, event);
      }
    },
    [GraphEvents.ON_REASONING_DELTA]: function (event: ServerSentEvent) {
      if (res) {
        sendEvent(res, event);
      }
    },
  };
}

export function createHandleLLMNewToken(streamRate: number) {
  return async function () {
    if (streamRate) {
      await sleep(streamRate);
    }
  };
}
