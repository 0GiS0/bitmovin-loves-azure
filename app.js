//Step 1: Add the Bitmovin SDK to Your Project
require('dotenv').config();
const path = require('path');
const BitmovinApi = require('@bitmovin/api-sdk').default;
const {
    CloudRegion,
    AzureInput,
    AzureOutput,
    H264VideoConfiguration,
    AacAudioConfiguration,
    Encoding,
    StreamInput,
    Stream,
    AclEntry,
    AclPermission,
    TsMuxing,
    MuxingStream,
    EncodingOutput,
    VideoAdaptationSet,
    AudioAdaptationSet,
    DashFmp4Representation,
    Fmp4Muxing,
    Period,
    DashManifest,
    StreamSelectionMode,
    PresetConfiguration,
    HlsManifest,
    AudioMediaInfo,
    StreamInfo,
    DashRepresentationType,
    InfrastructureSettings, //for Cloud Connect
    PrewarmedEncoderPool, //for Pre-warmed pools
    PrewarmedEncoderDiskSize
} = require('@bitmovin/api-sdk');


async function main() {

    //Step 2: Setup a Bitmovin API Client Instance
    const bitmovinApi = new BitmovinApi({
        apiKey: process.env.YOUR_API_KEY
    });

    //Step 3: Create an Input
    console.log(`Create an AzureInput for ${process.env.INPUT_FILE}...`);
    const input = await bitmovinApi.encoding.inputs.azure.create(
        new AzureInput({
            name: `Inputs container in ${process.env.ACCOUNT_NAME}`,
            accountName: process.env.ACCOUNT_NAME,
            accountKey: process.env.ACCOUNT_KEY,
            container: process.env.CONTAINER_INPUTS
        })
    );

    //Step 4: Create an OutputLink
    console.log(`Create an AzureOutput in ${process.env.ACCOUNT_NAME} (${process.env.CONTAINER_OUTPUTS} container)`);
    const output = await bitmovinApi.encoding.outputs.azure.create(
        new AzureOutput({
            name: `Outputs container in ${process.env.ACCOUNT_NAME}`,
            accountName: process.env.ACCOUNT_NAME,
            accountKey: process.env.ACCOUNT_KEY,
            container: process.env.CONTAINER_OUTPUTS, //Public access level must be blob
        })
    );

    const outputId = output.id;

    //Step 5: Create Codec Configurations
    console.log(`Create codec configuration for H264`);

    // Video Codec Configurations
    const videoCodecConfiguration1 = await bitmovinApi.encoding.configurations.video.h264.create(
        new H264VideoConfiguration({
            name: 'H264 Codec Config for 1024',
            bitrate: 1500000,
            width: 1024,
            presetConfiguration: PresetConfiguration.VOD_STANDARD
        })
    );

    const videoCodecConfiguration2 = await bitmovinApi.encoding.configurations.video.h264.create(
        new H264VideoConfiguration({
            name: 'H264 Codec for 768',
            bitrate: 1000000,
            width: 768,
            presetConfiguration: PresetConfiguration.VOD_STANDARD
        })
    );

    const videoCodecConfiguration3 = await bitmovinApi.encoding.configurations.video.h264.create(
        new H264VideoConfiguration({
            name: 'H264 Codec for 640',
            bitrate: 750000,
            width: 640,
            presetConfiguration: PresetConfiguration.VOD_STANDARD
        })
    );

    //Audio Codec Configurations
    const audioCodecConfiguration = await bitmovinApi.encoding.configurations.audio.aac.create(
        new AacAudioConfiguration({
            name: 'Audio Codec Config',
            bitrate: 128000
        })
    );

    //Step 6: Create Encoding
    console.log(`Create encoding in Azure West Europe`);
    const encoding = await bitmovinApi.encoding.encodings.create(
        new Encoding({
            name: `Encoding for ${process.env.INPUT_FILE} in ${CloudRegion.AZURE_EUROPE_WEST}`,
            cloudRegion: CloudRegion.AZURE_EUROPE_WEST
        })
    );

    //BETA: Pre-warmed Encoder Pools (https://bitmovin.com/docs/encoding/tutorials/pre-warmed-encoder-pools)
    // console.log(`Create pre-warmed pool`);
    // let poolToCreate = new PrewarmedEncoderPool({
    //     name: "Fast-track encodings",
    //     description: "Use for encodings that have to be done immediately",
    //     encoderVersion: "2.77.2",
    //     infrastructureId: process.env.INFRASTRUCTURE_ID,
    //     cloudRegion: CloudRegion.AZURE_EUROPE_WEST,
    //     diskSize: PrewarmedEncoderDiskSize.GB_500,
    //     targetPoolSize: 1
    // });

    // let createdPool = await bitmovinApi.encoding.infrastructure.prewarmedEncoderPools.create(poolToCreate);
    // console.log(`Pre-warmed pool created with id ${createdPool.id}`);
    // console.log(`Starting the pool ${createdPool.id}`);
    // await bitmovinApi.encoding.infrastructure.prewarmedEncoderPools.start(createdPool.id);

    // let listOfPools = await bitmovinApi.encoding.infrastructure.prewarmedEncoderPools.list();
    // console.dir(listOfPools);

    //Cloud Connect with Azure
    // console.log(`Create encoding using Cloud Connect`);
    // const encoding = await bitmovinApi.encoding.encodings.create(
    //     new Encoding({
    //         name: `Encoding for ${process.env.INPUT_FILE} using Cloud Connect and Azure`,
    //         cloudRegion: CloudRegion.EXTERNAL,
    //         infrastructure: new InfrastructureSettings({
    //             infrastructureId: process.env.INFRASTRUCTURE_ID,
    //             cloudRegion: CloudRegion.AZURE_EUROPE_WEST
    //         })
    //     })
    // );


    //Video Stream  (Encodes the input file to a bitstream using the codec configuration)
    const videoStreamInput1 = new StreamInput({
        inputId: input.id,
        inputPath: process.env.INPUT_FILE,
        selectionMode: StreamSelectionMode.AUTO
    });

    const videoStream1 = await bitmovinApi.encoding.encodings.streams.create(
        encoding.id,
        new Stream({
            codecConfigId: videoCodecConfiguration1.id,
            inputStreams: [videoStreamInput1]
        })
    );

    const videoStreamInput2 = new StreamInput({
        inputId: input.id,
        inputPath: process.env.INPUT_FILE,
        selectionMode: StreamSelectionMode.AUTO
    });

    const videoStream2 = await bitmovinApi.encoding.encodings.streams.create(
        encoding.id,
        new Stream({
            codecConfigId: videoCodecConfiguration2.id,
            inputStreams: [videoStreamInput2]
        })
    );

    const videoStreamInput3 = new StreamInput({
        inputId: input.id,
        inputPath: process.env.INPUT_FILE,
        selectionMode: StreamSelectionMode.AUTO
    });

    const videoStream3 = await bitmovinApi.encoding.encodings.streams.create(
        encoding.id,
        new Stream({
            codecConfigId: videoCodecConfiguration3.id,
            inputStreams: [videoStreamInput3]
        })
    );

    //Audio Stream
    const audioStreamInput = new StreamInput({
        inputId: input.id,
        inputPath: process.env.INPUT_FILE,
        selectionMode: StreamSelectionMode.AUTO
    });

    const audioStream = await bitmovinApi.encoding.encodings.streams.create(
        encoding.id,
        new Stream({
            codecConfigId: audioCodecConfiguration.id,
            inputStreams: [audioStreamInput]
        })
    );

    //Step 7: Create a Muxing
    //Muxings: Contenerizes the Stream to segments in formats like fmp4 (DASH), ts (HLS), webm

    //  FMP4 (DASH)
    // Video Muxings
    const aclEntry = new AclEntry({
        permission: AclPermission.PUBLIC_READ
    });

    const segmentLength = 4;
    const dashOutputPath = path.basename(process.env.INPUT_FILE, path.extname(process.env.INPUT_FILE));
    const dashSegmentNaming = 'seg_%number%.m4s';
    const initSegmentName = 'init.mp4';

    const fmp4VideoMuxing1 = await bitmovinApi.encoding.encodings.muxings.fmp4.create(
        encoding.id,
        new Fmp4Muxing({
            segmentLength: segmentLength,
            segmentNaming: dashSegmentNaming,
            initSegmentName: initSegmentName,
            streams: [new MuxingStream({ streamId: videoStream1.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: dashOutputPath + '/video/1024_1500000/fmp4/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    const fmp4VideoMuxing2 = await bitmovinApi.encoding.encodings.muxings.fmp4.create(
        encoding.id,
        new Fmp4Muxing({
            segmentLength: segmentLength,
            segmentNaming: dashSegmentNaming,
            initSegmentName: initSegmentName,
            streams: [new MuxingStream({ streamId: videoStream2.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: dashOutputPath + '/video/768_1000000/fmp4/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    const videoMuxing3 = await bitmovinApi.encoding.encodings.muxings.fmp4.create(
        encoding.id,
        new Fmp4Muxing({
            segmentLength: segmentLength,
            segmentNaming: dashSegmentNaming,
            initSegmentName: initSegmentName,
            streams: [new MuxingStream({ streamId: videoStream3.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: dashOutputPath + '/video/640_750000/fmp4/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    //Audio Muxings
    const fmp4AudioMuxing = await bitmovinApi.encoding.encodings.muxings.fmp4.create(
        encoding.id,
        new Fmp4Muxing({
            segmentLength: segmentLength,
            segmentNaming: dashSegmentNaming,
            initSegmentName: initSegmentName,
            streams: [new MuxingStream({ streamId: audioStream.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: dashOutputPath + '/audio/128000/fmp4/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    //TS for HLS
    const hlsAclEntry = new AclEntry({
        permission: AclPermission.PUBLIC_READ
    });

    // const segmentLength = 4;
    const hlsOutputPath = path.basename(process.env.INPUT_FILE, path.extname(process.env.INPUT_FILE));
    const hlsSegmentNaming = 'seg_%number%.ts';

    const tsVideoMuxing1 = await bitmovinApi.encoding.encodings.muxings.ts.create(
        encoding.id,
        new TsMuxing({
            segmentLength: segmentLength,
            segmentNaming: hlsSegmentNaming,
            streams: [new MuxingStream({ streamId: videoStream1.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: hlsOutputPath + '/video/1024_1500000/ts/',
                    acl: [hlsAclEntry]
                })
            ]
        })
    );

    const tsVideoMuxing2 = await bitmovinApi.encoding.encodings.muxings.ts.create(
        encoding.id,
        new TsMuxing({
            segmentLength: segmentLength,
            segmentNaming: hlsSegmentNaming,
            streams: [new MuxingStream({ streamId: videoStream2.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: hlsOutputPath + '/video/768_1000000/ts/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    const tsVideoMuxing3 = await bitmovinApi.encoding.encodings.muxings.ts.create(
        encoding.id,
        new TsMuxing({
            segmentLength: segmentLength,
            segmentNaming: hlsSegmentNaming,
            streams: [new MuxingStream({ streamId: videoStream3.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: hlsOutputPath + '/video/640_750000/ts/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    // //Audio Muxings
    const tsAudioMuxing = await bitmovinApi.encoding.encodings.muxings.ts.create(
        encoding.id,
        new TsMuxing({
            segmentLength: segmentLength,
            segmentNaming: hlsSegmentNaming,
            streams: [new MuxingStream({ streamId: audioStream.id })],
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: hlsOutputPath + '/audio/128000/ts/',
                    acl: [aclEntry]
                })
            ]
        })
    );

    //Step 8: Start Encoding
    await bitmovinApi.encoding.encodings.start(encoding.id);

    //Step 9: Create a manifests

    //  Create a DASH Manifest
    const dashManifest = await bitmovinApi.encoding.manifests.dash.create(
        new DashManifest({
            name: `${process.env.INPUT_FILE} manifest for DASH`,
            manifestName: 'manifest.mpd',
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: dashOutputPath,
                    acl: [aclEntry]
                })
            ]
        })
    );

    const period = await bitmovinApi.encoding.manifests.dash.periods.create(
        dashManifest.id,
        new Period()
    );

    //Add Adaptation Sets
    const videoAdaptationSet = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.video.create(
        dashManifest.id,
        period.id,
        new VideoAdaptationSet()
    );

    const audioAdaptationSet = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.audio.create(
        dashManifest.id,
        period.id,
        new AudioAdaptationSet({
            lang: 'en'
        })
    );

    //Add Representations

    // Adding Audio Representation
    const audioRepresentation = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.representations.fmp4.create(
        dashManifest.id,
        period.id,
        audioAdaptationSet.id,
        new DashFmp4Representation({
            type: DashRepresentationType.TEMPLATE,
            encodingId: encoding.id,
            muxingId: fmp4AudioMuxing.id,
            segmentPath: 'audio/128000/fmp4'
        })
    );

    // // Adding Video Representation
    const videoRepresentation1 = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.representations.fmp4.create(
        dashManifest.id,
        period.id,
        videoAdaptationSet.id,
        new DashFmp4Representation({
            type: DashRepresentationType.TEMPLATE,
            encodingId: encoding.id,
            muxingId: fmp4VideoMuxing1.id,
            segmentPath: 'video/1024_1500000/fmp4'
        })
    );

    // // Adding Video Representation

    const videoRepresentation2 = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.representations.fmp4.create(
        dashManifest.id,
        period.id,
        videoAdaptationSet.id,
        new DashFmp4Representation({
            type: DashRepresentationType.TEMPLATE,
            encodingId: encoding.id,
            muxingId: fmp4VideoMuxing2.id,
            segmentPath: 'video/768_1000000/fmp4'
        })
    );

    // // Adding Video Representation

    const videoRepresentation3 = await bitmovinApi.encoding.manifests.dash.periods.adaptationsets.representations.fmp4.create(
        dashManifest.id,
        period.id,
        videoAdaptationSet.id,
        new DashFmp4Representation({
            type: DashRepresentationType.TEMPLATE,
            encodingId: encoding.id,
            muxingId: videoMuxing3.id,
            segmentPath: 'video/640_750000/fmp4'
        })
    );

    //Start Manifest Generation
    console.log(`Start DASH manifest generation`);
    await bitmovinApi.encoding.manifests.dash.start(dashManifest.id);

    //HLS Manifest
    //Create a HLS manifest
    console.log(`Create HLS manifest`);
    const hlsManifest = await bitmovinApi.encoding.manifests.hls.create(
        new HlsManifest({
            name: `${process.env.INPUT_FILE} manifest for HLS`,
            manifestName: 'manifest.m3u8',
            outputs: [
                new EncodingOutput({
                    outputId: outputId,
                    outputPath: hlsOutputPath,
                    acl: [aclEntry]
                })
            ]
        })
    );

    // //Create Audio Media Info and Video playlist
    const audioMediaInfo = new AudioMediaInfo({
        name: 'my-audio-media',
        groupId: 'audio_group',
        segmentPath: 'audio/128000/ts',
        uri: 'audiomedia.m3u8',
        encodingId: encoding.id,
        streamId: audioStream.id,
        muxingId: tsAudioMuxing.id,
        language: 'en'
    });

    await bitmovinApi.encoding.manifests.hls.media.audio.create(hlsManifest.id, audioMediaInfo);

    const streamInfo1 = await bitmovinApi.encoding.manifests.hls.streams.create(
        hlsManifest.id,
        new StreamInfo({
            audio: 'audio_group',
            closedCaptions: 'NONE',
            segmentPath: 'video/1024_1500000/ts',
            uri: 'video1.m3u8',
            encodingId: encoding.id,
            streamId: videoStream1.id,
            muxingId: tsVideoMuxing1.id
        })
    );

    const streamInfo2 = await bitmovinApi.encoding.manifests.hls.streams.create(
        hlsManifest.id,
        new StreamInfo({
            audio: 'audio_group',
            closedCaptions: 'NONE',
            segmentPath: 'video/768_1000000/ts',
            uri: 'video2.m3u8',
            encodingId: encoding.id,
            streamId: videoStream2.id,
            muxingId: tsVideoMuxing2.id
        })
    );

    const streamInfo3 = await bitmovinApi.encoding.manifests.hls.streams.create(
        hlsManifest.id,
        new StreamInfo({
            audio: 'audio_group',
            closedCaptions: 'NONE',
            segmentPath: 'video/640_750000/ts',
            uri: 'video3.m3u8',
            encodingId: encoding.id,
            streamId: videoStream3.id,
            muxingId: tsVideoMuxing3.id
        })
    );

    //Start Manifest Generation
    console.log(`Start HLS manifest generation`);
    await bitmovinApi.encoding.manifests.hls.start(hlsManifest.id);

    console.log(`Test DASH:`);
    console.log(`https://bitmovin.com/demos/stream-test?format=dash&manifest=https%3A%2F%2F${process.env.ACCOUNT_NAME}.blob.core.windows.net%2F${process.env.CONTAINER_OUTPUTS}%2F${path.basename(process.env.INPUT_FILE, path.extname(process.env.INPUT_FILE))}%2Fmanifest.mpd`)

    console.log(`Test HLS:`);
    console.log(`https://bitmovin.com/demos/stream-test?format=hls&manifest=https%3A%2F%2F${process.env.ACCOUNT_NAME}.blob.core.windows.net%2F${process.env.CONTAINER_OUTPUTS}%2F${path.basename(process.env.INPUT_FILE, path.extname(process.env.INPUT_FILE))}%2Fmanifest.m3u8`);

}

main();